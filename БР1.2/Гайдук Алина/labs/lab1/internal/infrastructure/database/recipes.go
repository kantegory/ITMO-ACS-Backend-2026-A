package database

import (
	"fmt"
	"strings"

	"recipehub/internal/infrastructure/database/model"

	"gorm.io/gorm"
)

type RecipeFilters struct {
	DishTypeID      *uint64
	DifficultyID    *uint64
	IngredientIDs   []uint64
	TagIDs          []uint64
	Search          string
	AuthorID        *uint64
	Limit, Offset   int
}

type RecipePage struct {
	Recipes []model.Recipe
	Total   int64
}

func (s *Store) ListRecipes(f RecipeFilters) (RecipePage, error) {
	q := s.DB.Model(&model.Recipe{})
	if f.DishTypeID != nil && *f.DishTypeID != 0 {
		q = q.Where("dish_type_id = ?", *f.DishTypeID)
	}
	if f.DifficultyID != nil && *f.DifficultyID != 0 {
		q = q.Where("difficulty_id = ?", *f.DifficultyID)
	}
	if f.AuthorID != nil {
		q = q.Where("author_id = ?", *f.AuthorID)
	}
	if sr := strings.TrimSpace(f.Search); sr != "" {
		pattern := "%" + strings.ToLower(sr) + "%"
		q = q.Where("LOWER(title) LIKE ?", pattern)
	}
	if len(f.IngredientIDs) > 0 {
		sub := s.DB.Table("recipe_ingredients").
			Select("recipe_id").
			Where("ingredient_id IN ?", f.IngredientIDs).
			Group("recipe_id").
			Having("COUNT(DISTINCT ingredient_id) = ?", len(f.IngredientIDs))
		q = q.Where("id IN (?)", sub)
	}
	if len(f.TagIDs) > 0 {
		sub := s.DB.Table("recipe_tags").
			Select("recipe_id").
			Where("tag_id IN ?", f.TagIDs).
			Group("recipe_id").
			Having("COUNT(DISTINCT tag_id) = ?", len(f.TagIDs))
		q = q.Where("id IN (?)", sub)
	}

	var total int64
	if err := q.Count(&total).Error; err != nil {
		return RecipePage{}, err
	}
	var recipes []model.Recipe
	err := q.
		Preload("Author").
		Preload("DishType").
		Preload("Difficulty").
		Preload("Tags").
		Order("created_at DESC").
		Limit(max1(f.Limit)).
		Offset(max0(f.Offset)).
		Find(&recipes).Error
	return RecipePage{Recipes: recipes, Total: total}, err
}

func (s *Store) RecipeByID(id uint64) (*model.Recipe, error) {
	var rec model.Recipe
	err := s.DB.
		Preload("Author").
		Preload("DishType").
		Preload("Difficulty").
		Preload("Tags").
		Preload("Steps").
		Preload("Ingredients.Ingredient").
		Preload("Ingredients.Unit").
		First(&rec, id).Error
	if err != nil {
		return nil, err
	}
	return &rec, nil
}

func (s *Store) RecipeExists(id uint64) bool {
	var c int64
	_ = s.DB.Model(&model.Recipe{}).Where("id = ?", id).Count(&c).Error
	return c > 0
}

func (s *Store) DeleteRecipe(id uint64) error {
	return s.DB.Transaction(func(tx *gorm.DB) error {
		var rec model.Recipe
		if err := tx.First(&rec, id).Error; err != nil {
			return err
		}
		if err := tx.Model(&rec).Association("Tags").Clear(); err != nil {
			return err
		}
		if err := tx.Where("recipe_id = ?", id).Delete(&model.Comment{}).Error; err != nil {
			return err
		}
		if err := tx.Where("recipe_id = ?", id).Delete(&model.RecipeLike{}).Error; err != nil {
			return err
		}
		if err := tx.Where("recipe_id = ?", id).Delete(&model.SavedRecipe{}).Error; err != nil {
			return err
		}
		if err := tx.Where("recipe_id = ?", id).Delete(&model.RecipeIngredient{}).Error; err != nil {
			return err
		}
		if err := tx.Where("recipe_id = ?", id).Delete(&model.RecipeStep{}).Error; err != nil {
			return err
		}
		return tx.Delete(&model.Recipe{}, id).Error
	})
}

func (s *Store) SaveRecipe(full *model.Recipe) error {
	return s.DB.Session(&gorm.Session{FullSaveAssociations: false}).Save(full).Error
}

func (s *Store) ReplaceRecipeAssociations(recipeID uint64, steps []model.RecipeStep, ingredients []model.RecipeIngredient, tags []model.Tag) error {
	return s.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("recipe_id = ?", recipeID).Delete(&model.RecipeStep{}).Error; err != nil {
			return err
		}
		for i := range steps {
			steps[i].RecipeID = recipeID
		}
		if len(steps) > 0 {
			if err := tx.Create(&steps).Error; err != nil {
				return err
			}
		}
		if err := tx.Where("recipe_id = ?", recipeID).Delete(&model.RecipeIngredient{}).Error; err != nil {
			return err
		}
		for i := range ingredients {
			ingredients[i].RecipeID = recipeID
		}
		if len(ingredients) > 0 {
			if err := tx.Create(&ingredients).Error; err != nil {
				return err
			}
		}
		var rec model.Recipe
		if err := tx.First(&rec, recipeID).Error; err != nil {
			return err
		}
		if err := tx.Model(&rec).Association("Tags").Replace(tags); err != nil {
			return err
		}
		return nil
	})
}

func (s *Store) CreateRecipeFull(base model.Recipe, steps []model.RecipeStep, ingredients []model.RecipeIngredient, tags []model.Tag) (uint64, error) {
	var recipeID uint64
	err := s.DB.Transaction(func(tx *gorm.DB) error {
		r := base
		if err := tx.Create(&r).Error; err != nil {
			return err
		}
		recipeID = r.ID
		for i := range steps {
			steps[i].RecipeID = r.ID
			steps[i].ID = 0
		}
		if len(steps) > 0 {
			if err := tx.Create(&steps).Error; err != nil {
				return fmt.Errorf("steps: %w", err)
			}
		}
		for i := range ingredients {
			ingredients[i].RecipeID = r.ID
			ingredients[i].ID = 0
		}
		if len(ingredients) > 0 {
			if err := tx.Create(&ingredients).Error; err != nil {
				return fmt.Errorf("ingredients: %w", err)
			}
		}
		if len(tags) > 0 {
			if err := tx.Model(&r).Association("Tags").Replace(tags); err != nil {
				return err
			}
		}
		return nil
	})
	return recipeID, err
}

func max1(n int) int {
	if n < 1 {
		return 1
	}
	if n > 100 {
		return 100
	}
	return n
}

func max0(n int) int {
	if n < 0 {
		return 0
	}
	return n
}
