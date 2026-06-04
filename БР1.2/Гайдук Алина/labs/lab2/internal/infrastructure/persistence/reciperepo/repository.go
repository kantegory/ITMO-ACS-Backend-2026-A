// Package reciperepo adapts recipe use cases to a GORM database.
package reciperepo

import (
	"context"
	"encoding/json"
	"errors"
	"strings"

	eventsdomain "recipehub/internal/domain/events"
	recipedomain "recipehub/internal/domain/recipe"
	recipeusecase "recipehub/internal/usecase/recipe"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const (
	recipesTable         = "recipes"
	stepsTable           = "recipe_steps"
	ingredientsTable     = "recipe_ingredients"
	tagsTable            = "recipe_tags"
	recipeStatsTable     = "recipe_engagement_stats"
	processedEventsTable = "processed_events"
)

var _ recipeusecase.Repository = (*Repository)(nil)

// Repository stores recipe data in PostgreSQL via GORM.
type Repository struct {
	db *gorm.DB
}

// New creates a recipe repository adapter.
func New(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

// CreateRecipe creates a full recipe aggregate.
func (r *Repository) CreateRecipe(ctx context.Context, recipe recipedomain.Recipe) (recipedomain.Recipe, error) {
	var created recipedomain.Recipe
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		row := toRecipeRow(recipe)
		if err := tx.Create(&row).Error; err != nil {
			return err
		}
		recipe.ID = row.ID
		if err := replaceChildren(tx, recipe); err != nil {
			return err
		}
		created = recipe
		created.CreatedAt = row.CreatedAt
		created.UpdatedAt = row.UpdatedAt
		return nil
	})
	if err != nil {
		return recipedomain.Recipe{}, err
	}

	return r.RecipeByID(ctx, created.ID)
}

// RecipeByID returns a recipe by id.
func (r *Repository) RecipeByID(ctx context.Context, id uint64) (recipedomain.Recipe, error) {
	var row recipeRow
	if err := r.db.WithContext(ctx).First(&row, id).Error; err != nil {
		return recipedomain.Recipe{}, mapNotFound(err)
	}

	recipe := toDomainRecipe(row)
	if err := r.loadChildren(ctx, &recipe); err != nil {
		return recipedomain.Recipe{}, err
	}

	return recipe, nil
}

// ListRecipes returns paginated recipes.
func (r *Repository) ListRecipes(ctx context.Context, filters recipedomain.Filters) (recipedomain.Page[recipedomain.Recipe], error) {
	query := r.db.WithContext(ctx).Model(&recipeRow{})
	if filters.AuthorID != nil {
		query = query.Where("author_id = ?", *filters.AuthorID)
	}
	if filters.DishTypeID != nil {
		query = query.Where("dish_type_id = ?", *filters.DishTypeID)
	}
	if filters.DifficultyID != nil {
		query = query.Where("difficulty_id = ?", *filters.DifficultyID)
	}
	if search := strings.TrimSpace(filters.Search); search != "" {
		query = query.Where("LOWER(title) LIKE ?", "%"+strings.ToLower(search)+"%")
	}
	if len(filters.IngredientIDs) > 0 {
		sub := r.db.Table(ingredientsTable).
			Select("recipe_id").
			Where("ingredient_id IN ?", filters.IngredientIDs).
			Group("recipe_id").
			Having("COUNT(DISTINCT ingredient_id) = ?", len(filters.IngredientIDs))
		query = query.Where("id IN (?)", sub)
	}
	if len(filters.TagIDs) > 0 {
		sub := r.db.Table(tagsTable).
			Select("recipe_id").
			Where("tag_id IN ?", filters.TagIDs).
			Group("recipe_id").
			Having("COUNT(DISTINCT tag_id) = ?", len(filters.TagIDs))
		query = query.Where("id IN (?)", sub)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return recipedomain.Page[recipedomain.Recipe]{}, err
	}

	var rows []recipeRow
	err := query.
		Order("created_at DESC").
		Limit(normalizeLimit(filters.Limit)).
		Offset(normalizeOffset(filters.Offset)).
		Find(&rows).
		Error
	if err != nil {
		return recipedomain.Page[recipedomain.Recipe]{}, err
	}

	items := make([]recipedomain.Recipe, 0, len(rows))
	for _, row := range rows {
		recipe := toDomainRecipe(row)
		if err := r.loadChildren(ctx, &recipe); err != nil {
			return recipedomain.Page[recipedomain.Recipe]{}, err
		}
		items = append(items, recipe)
	}

	return recipedomain.Page[recipedomain.Recipe]{Items: items, Total: total}, nil
}

// UpdateRecipe replaces a full recipe aggregate.
func (r *Repository) UpdateRecipe(ctx context.Context, recipe recipedomain.Recipe) (recipedomain.Recipe, error) {
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(toRecipeRow(recipe)).Error; err != nil {
			return err
		}
		return replaceChildren(tx, recipe)
	})
	if err != nil {
		return recipedomain.Recipe{}, err
	}

	return r.RecipeByID(ctx, recipe.ID)
}

// DeleteRecipe deletes a recipe aggregate.
func (r *Repository) DeleteRecipe(ctx context.Context, id uint64) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("recipe_id = ?", id).Delete(&stepRow{}).Error; err != nil {
			return err
		}
		if err := tx.Where("recipe_id = ?", id).Delete(&ingredientRow{}).Error; err != nil {
			return err
		}
		if err := tx.Where("recipe_id = ?", id).Delete(&tagRow{}).Error; err != nil {
			return err
		}
		return tx.Delete(&recipeRow{}, id).Error
	})
}

// RecipeExists checks whether a recipe exists.
func (r *Repository) RecipeExists(ctx context.Context, id uint64) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&recipeRow{}).Where("id = ?", id).Count(&count).Error
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

// AuthorRecipeCount returns recipe count by author.
func (r *Repository) AuthorRecipeCount(ctx context.Context, authorID uint64) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&recipeRow{}).Where("author_id = ?", authorID).Count(&count).Error
	if err != nil {
		return 0, err
	}

	return count, nil
}

// EngagementStatsBatch returns async engagement projections for recipe ids.
func (r *Repository) EngagementStatsBatch(ctx context.Context, ids []uint64) (map[uint64]recipedomain.EngagementStats, error) {
	out := make(map[uint64]recipedomain.EngagementStats, len(ids))
	if len(ids) == 0 {
		return out, nil
	}

	var rows []recipeStatsRow
	if err := r.db.WithContext(ctx).Where("recipe_id IN ?", ids).Find(&rows).Error; err != nil {
		return nil, err
	}
	for _, row := range rows {
		out[row.RecipeID] = recipedomain.EngagementStats{
			LikesCount:    row.LikesCount,
			CommentsCount: row.CommentsCount,
		}
	}

	return out, nil
}

// ApplyEngagementEvent updates local recipe read-model counters idempotently.
func (r *Repository) ApplyEngagementEvent(ctx context.Context, event eventsdomain.Envelope) error {
	targetID, likesDelta, commentsDelta, err := recipeEventDelta(event)
	if err != nil {
		return err
	}
	if targetID == 0 || likesDelta == 0 && commentsDelta == 0 {
		return nil
	}

	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		err := tx.Create(&processedEventRow{EventID: event.EventID, EventType: event.EventType}).Error
		if err != nil {
			if isDuplicateKey(err) {
				return nil
			}
			return err
		}

		if err := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&recipeStatsRow{RecipeID: targetID}).Error; err != nil {
			return err
		}

		return tx.Model(&recipeStatsRow{}).
			Where("recipe_id = ?", targetID).
			Updates(map[string]any{
				"likes_count":    gorm.Expr("GREATEST(likes_count + ?, 0)", likesDelta),
				"comments_count": gorm.Expr("GREATEST(comments_count + ?, 0)", commentsDelta),
			}).Error
	})
}

func recipeEventDelta(event eventsdomain.Envelope) (targetID uint64, likesDelta, commentsDelta int64, err error) {
	switch event.EventType {
	case eventsdomain.TypeRecipeLiked:
		var payload eventsdomain.LikePayload
		if err := json.Unmarshal(event.Payload, &payload); err != nil {
			return 0, 0, 0, err
		}
		return payload.TargetID, 1, 0, nil
	case eventsdomain.TypeRecipeUnliked:
		var payload eventsdomain.LikePayload
		if err := json.Unmarshal(event.Payload, &payload); err != nil {
			return 0, 0, 0, err
		}
		return payload.TargetID, -1, 0, nil
	case eventsdomain.TypeRecipeCommentCreated:
		var payload eventsdomain.CommentCreatedPayload
		if err := json.Unmarshal(event.Payload, &payload); err != nil {
			return 0, 0, 0, err
		}
		return payload.TargetID, 0, 1, nil
	case eventsdomain.TypeRecipeCommentDeleted:
		var payload eventsdomain.CommentDeletedPayload
		if err := json.Unmarshal(event.Payload, &payload); err != nil {
			return 0, 0, 0, err
		}
		return payload.TargetID, 0, -payload.DeletedCount, nil
	default:
		return 0, 0, 0, nil
	}
}

func (r *Repository) loadChildren(ctx context.Context, recipe *recipedomain.Recipe) error {
	var steps []stepRow
	if err := r.db.WithContext(ctx).Where("recipe_id = ?", recipe.ID).Order("step_number ASC").Find(&steps).Error; err != nil {
		return err
	}
	recipe.Steps = make([]recipedomain.Step, 0, len(steps))
	for _, row := range steps {
		recipe.Steps = append(recipe.Steps, recipedomain.Step{
			ID:          row.ID,
			StepNumber:  row.StepNumber,
			Description: row.Description,
			ImageURL:    row.ImageURL,
		})
	}

	var ingredients []ingredientRow
	if err := r.db.WithContext(ctx).Where("recipe_id = ?", recipe.ID).Find(&ingredients).Error; err != nil {
		return err
	}
	recipe.Ingredients = make([]recipedomain.Ingredient, 0, len(ingredients))
	for _, row := range ingredients {
		recipe.Ingredients = append(recipe.Ingredients, recipedomain.Ingredient{
			ID:           row.ID,
			IngredientID: row.IngredientID,
			Quantity:     row.Quantity,
			UnitID:       row.UnitID,
			Note:         row.Note,
		})
	}

	var tagRows []tagRow
	if err := r.db.WithContext(ctx).Where("recipe_id = ?", recipe.ID).Find(&tagRows).Error; err != nil {
		return err
	}
	recipe.TagIDs = make([]uint64, 0, len(tagRows))
	for _, row := range tagRows {
		recipe.TagIDs = append(recipe.TagIDs, row.TagID)
	}

	return nil
}

func replaceChildren(tx *gorm.DB, recipe recipedomain.Recipe) error {
	if err := tx.Where("recipe_id = ?", recipe.ID).Delete(&stepRow{}).Error; err != nil {
		return err
	}
	for _, step := range recipe.Steps {
		row := stepRow{
			RecipeID:    recipe.ID,
			StepNumber:  step.StepNumber,
			Description: step.Description,
			ImageURL:    step.ImageURL,
		}
		if err := tx.Create(&row).Error; err != nil {
			return err
		}
	}

	if err := tx.Where("recipe_id = ?", recipe.ID).Delete(&ingredientRow{}).Error; err != nil {
		return err
	}
	for _, ingredient := range recipe.Ingredients {
		row := ingredientRow{
			RecipeID:     recipe.ID,
			IngredientID: ingredient.IngredientID,
			Quantity:     ingredient.Quantity,
			UnitID:       ingredient.UnitID,
			Note:         ingredient.Note,
		}
		if err := tx.Create(&row).Error; err != nil {
			return err
		}
	}

	if err := tx.Where("recipe_id = ?", recipe.ID).Delete(&tagRow{}).Error; err != nil {
		return err
	}
	for _, tagID := range recipe.TagIDs {
		if err := tx.Create(&tagRow{RecipeID: recipe.ID, TagID: tagID}).Error; err != nil {
			return err
		}
	}

	return nil
}

func mapNotFound(err error) error {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return recipeusecase.ErrNotFound
	}

	return err
}

func isDuplicateKey(err error) bool {
	if errors.Is(err, gorm.ErrDuplicatedKey) {
		return true
	}

	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "duplicate key") || strings.Contains(msg, "unique constraint")
}

func toDomainRecipe(row recipeRow) recipedomain.Recipe {
	return recipedomain.Recipe{
		ID:              row.ID,
		AuthorID:        row.AuthorID,
		Title:           row.Title,
		Description:     row.Description,
		CoverImageURL:   row.CoverImageURL,
		VideoURL:        row.VideoURL,
		DishTypeID:      row.DishTypeID,
		DifficultyID:    row.DifficultyID,
		PrepTimeMinutes: row.PrepTimeMinutes,
		CookTimeMinutes: row.CookTimeMinutes,
		Servings:        row.Servings,
		CreatedAt:       row.CreatedAt,
		UpdatedAt:       row.UpdatedAt,
	}
}

func toRecipeRow(recipe recipedomain.Recipe) recipeRow {
	return recipeRow{
		ID:              recipe.ID,
		AuthorID:        recipe.AuthorID,
		Title:           recipe.Title,
		Description:     recipe.Description,
		CoverImageURL:   recipe.CoverImageURL,
		VideoURL:        recipe.VideoURL,
		DishTypeID:      recipe.DishTypeID,
		DifficultyID:    recipe.DifficultyID,
		PrepTimeMinutes: recipe.PrepTimeMinutes,
		CookTimeMinutes: recipe.CookTimeMinutes,
		Servings:        recipe.Servings,
		CreatedAt:       recipe.CreatedAt,
		UpdatedAt:       recipe.UpdatedAt,
	}
}

func normalizeLimit(limit int) int {
	if limit < 1 {
		return 1
	}

	return limit
}

func normalizeOffset(offset int) int {
	if offset < 0 {
		return 0
	}

	return offset
}
