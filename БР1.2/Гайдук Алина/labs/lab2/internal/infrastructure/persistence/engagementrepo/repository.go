// Package engagementrepo adapts engagement use cases to a GORM database.
package engagementrepo

import (
	"context"
	"errors"
	"strings"

	engagementdomain "recipehub/internal/domain/engagement"
	engagementusecase "recipehub/internal/usecase/engagement"

	"github.com/jackc/pgx/v5/pgconn"
	"gorm.io/gorm"
)

const (
	commentsTable     = "comments"
	recipeLikesTable  = "recipe_likes"
	postLikesTable    = "post_likes"
	savedRecipesTable = "saved_recipes"
)

var _ engagementusecase.Repository = (*Repository)(nil)

// Repository stores engagement data in PostgreSQL via GORM.
type Repository struct {
	db *gorm.DB
}

// New creates an engagement repository adapter.
func New(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

// ListComments returns root comments for a target.
func (r *Repository) ListComments(ctx context.Context, target engagementdomain.TargetType, targetID uint64, limit, offset int) (engagementdomain.Page[engagementdomain.Comment], error) {
	var total int64
	query := r.db.WithContext(ctx).
		Model(&commentRow{}).
		Where("target_type = ? AND target_id = ? AND parent_comment_id IS NULL", string(target), targetID)
	if err := query.Count(&total).Error; err != nil {
		return engagementdomain.Page[engagementdomain.Comment]{}, err
	}

	var rows []commentRow
	err := query.
		Order("created_at ASC").
		Limit(normalizeLimit(limit)).
		Offset(normalizeOffset(offset)).
		Find(&rows).
		Error
	if err != nil {
		return engagementdomain.Page[engagementdomain.Comment]{}, err
	}

	return engagementdomain.Page[engagementdomain.Comment]{
		Items: toComments(rows),
		Total: total,
	}, nil
}

// CommentDescendants returns all replies under root comments.
func (r *Repository) CommentDescendants(ctx context.Context, target engagementdomain.TargetType, targetID uint64, rootIDs []uint64) ([]engagementdomain.Comment, error) {
	if len(rootIDs) == 0 {
		return nil, nil
	}

	seen := make(map[uint64]struct{}, len(rootIDs))
	frontier := append([]uint64(nil), rootIDs...)
	for _, id := range rootIDs {
		seen[id] = struct{}{}
	}

	collected := make([]engagementdomain.Comment, 0)
	for len(frontier) > 0 {
		var rows []commentRow
		err := r.db.WithContext(ctx).
			Where("target_type = ? AND target_id = ? AND parent_comment_id IN ?", string(target), targetID, frontier).
			Order("created_at ASC").
			Find(&rows).
			Error
		if err != nil {
			return nil, err
		}

		frontier = frontier[:0]
		for _, row := range rows {
			comment := toComment(row)
			collected = append(collected, comment)
			if _, ok := seen[comment.ID]; ok {
				continue
			}
			seen[comment.ID] = struct{}{}
			frontier = append(frontier, comment.ID)
		}
	}

	return collected, nil
}

// CommentByID returns a comment by id.
func (r *Repository) CommentByID(ctx context.Context, id uint64) (engagementdomain.Comment, error) {
	var row commentRow
	if err := r.db.WithContext(ctx).First(&row, id).Error; err != nil {
		return engagementdomain.Comment{}, mapNotFound(err)
	}

	return toComment(row), nil
}

// CreateComment creates a comment.
func (r *Repository) CreateComment(ctx context.Context, comment engagementdomain.Comment) (engagementdomain.Comment, error) {
	row := commentRow{
		AuthorID:        comment.AuthorID,
		TargetType:      string(comment.TargetType),
		TargetID:        comment.TargetID,
		ParentCommentID: comment.ParentCommentID,
		Content:         comment.Content,
	}
	if err := r.db.WithContext(ctx).Create(&row).Error; err != nil {
		return engagementdomain.Comment{}, err
	}

	return toComment(row), nil
}

// DeleteCommentSubtree deletes a comment and replies.
func (r *Repository) DeleteCommentSubtree(ctx context.Context, id uint64) (int64, error) {
	var deleted int64
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		frontier := []uint64{id}
		levels := [][]uint64{}
		for len(frontier) > 0 {
			levels = append(levels, append([]uint64(nil), frontier...))

			var children []commentRow
			if err := tx.Where("parent_comment_id IN ?", frontier).Find(&children).Error; err != nil {
				return err
			}

			frontier = frontier[:0]
			for _, child := range children {
				frontier = append(frontier, child.ID)
			}
		}

		for level := len(levels) - 1; level >= 0; level-- {
			result := tx.Delete(&commentRow{}, levels[level])
			if result.Error != nil {
				return result.Error
			}
			deleted += result.RowsAffected
		}

		return nil
	})

	return deleted, err
}

// Like creates a like.
func (r *Repository) Like(ctx context.Context, target engagementdomain.TargetType, userID, targetID uint64) error {
	var err error
	switch target {
	case engagementdomain.TargetRecipe:
		err = r.db.WithContext(ctx).Create(&recipeLikeRow{UserID: userID, RecipeID: targetID}).Error
	case engagementdomain.TargetPost:
		err = r.db.WithContext(ctx).Create(&postLikeRow{UserID: userID, PostID: targetID}).Error
	default:
		return engagementusecase.ErrInvalidInput
	}

	return mapDuplicateKey(err)
}

// Unlike deletes a like.
func (r *Repository) Unlike(ctx context.Context, target engagementdomain.TargetType, userID, targetID uint64) error {
	var result *gorm.DB
	switch target {
	case engagementdomain.TargetRecipe:
		result = r.db.WithContext(ctx).Where("user_id = ? AND recipe_id = ?", userID, targetID).Delete(&recipeLikeRow{})
	case engagementdomain.TargetPost:
		result = r.db.WithContext(ctx).Where("user_id = ? AND post_id = ?", userID, targetID).Delete(&postLikeRow{})
	default:
		return engagementusecase.ErrInvalidInput
	}
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return engagementusecase.ErrNotFound
	}

	return nil
}

// LikesCount returns like count.
func (r *Repository) LikesCount(ctx context.Context, target engagementdomain.TargetType, targetID uint64) (int64, error) {
	var count int64
	err := likeQuery(r.db.WithContext(ctx), target, targetID).Count(&count).Error
	return count, err
}

// IsLiked reports whether user liked target.
func (r *Repository) IsLiked(ctx context.Context, target engagementdomain.TargetType, userID, targetID uint64) (bool, error) {
	var count int64
	err := likeQuery(r.db.WithContext(ctx), target, targetID).Where("user_id = ?", userID).Count(&count).Error
	return count > 0, err
}

// SaveRecipe saves a recipe for a user.
func (r *Repository) SaveRecipe(ctx context.Context, userID, recipeID uint64) error {
	return mapDuplicateKey(r.db.WithContext(ctx).Create(&savedRecipeRow{UserID: userID, RecipeID: recipeID}).Error)
}

// UnsaveRecipe removes a saved recipe.
func (r *Repository) UnsaveRecipe(ctx context.Context, userID, recipeID uint64) error {
	return r.db.WithContext(ctx).Where("user_id = ? AND recipe_id = ?", userID, recipeID).Delete(&savedRecipeRow{}).Error
}

// IsSaved reports whether recipe is saved.
func (r *Repository) IsSaved(ctx context.Context, userID, recipeID uint64) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&savedRecipeRow{}).Where("user_id = ? AND recipe_id = ?", userID, recipeID).Count(&count).Error
	return count > 0, err
}

// ListSavedRecipes returns saved recipe refs.
func (r *Repository) ListSavedRecipes(ctx context.Context, userID uint64, limit, offset int) (engagementdomain.Page[engagementdomain.SavedRecipe], error) {
	var total int64
	query := r.db.WithContext(ctx).Model(&savedRecipeRow{}).Where("user_id = ?", userID)
	if err := query.Count(&total).Error; err != nil {
		return engagementdomain.Page[engagementdomain.SavedRecipe]{}, err
	}

	var rows []savedRecipeRow
	err := query.
		Order("created_at DESC").
		Limit(normalizeLimit(limit)).
		Offset(normalizeOffset(offset)).
		Find(&rows).
		Error
	if err != nil {
		return engagementdomain.Page[engagementdomain.SavedRecipe]{}, err
	}

	items := make([]engagementdomain.SavedRecipe, 0, len(rows))
	for _, row := range rows {
		items = append(items, engagementdomain.SavedRecipe{
			UserID:    row.UserID,
			RecipeID:  row.RecipeID,
			CreatedAt: row.CreatedAt,
		})
	}

	return engagementdomain.Page[engagementdomain.SavedRecipe]{Items: items, Total: total}, nil
}

// StatsBatch returns counts for target ids.
func (r *Repository) StatsBatch(ctx context.Context, target engagementdomain.TargetType, ids []uint64) ([]engagementdomain.Stat, error) {
	stats := make([]engagementdomain.Stat, 0, len(ids))
	for _, id := range ids {
		likes, err := r.LikesCount(ctx, target, id)
		if err != nil {
			return nil, err
		}

		var comments int64
		err = r.db.WithContext(ctx).
			Model(&commentRow{}).
			Where("target_type = ? AND target_id = ?", string(target), id).
			Count(&comments).
			Error
		if err != nil {
			return nil, err
		}

		stats = append(stats, engagementdomain.Stat{TargetID: id, LikesCount: likes, CommentsCount: comments})
	}

	return stats, nil
}

func likeQuery(db *gorm.DB, target engagementdomain.TargetType, targetID uint64) *gorm.DB {
	if target == engagementdomain.TargetRecipe {
		return db.Model(&recipeLikeRow{}).Where("recipe_id = ?", targetID)
	}

	return db.Model(&postLikeRow{}).Where("post_id = ?", targetID)
}

func mapNotFound(err error) error {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return engagementusecase.ErrNotFound
	}

	return err
}

func mapDuplicateKey(err error) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, gorm.ErrDuplicatedKey) {
		return engagementusecase.ErrAlreadyExists
	}

	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		return engagementusecase.ErrAlreadyExists
	}

	msg := strings.ToLower(err.Error())
	if strings.Contains(msg, "duplicate key") || strings.Contains(msg, "unique constraint") {
		return engagementusecase.ErrAlreadyExists
	}

	return err
}

func toComments(rows []commentRow) []engagementdomain.Comment {
	out := make([]engagementdomain.Comment, 0, len(rows))
	for _, row := range rows {
		out = append(out, toComment(row))
	}

	return out
}

func toComment(row commentRow) engagementdomain.Comment {
	return engagementdomain.Comment{
		ID:              row.ID,
		AuthorID:        row.AuthorID,
		TargetType:      engagementdomain.TargetType(row.TargetType),
		TargetID:        row.TargetID,
		ParentCommentID: row.ParentCommentID,
		Content:         row.Content,
		CreatedAt:       row.CreatedAt,
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
