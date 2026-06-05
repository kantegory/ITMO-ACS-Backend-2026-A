// Package engagementrepo adapts engagement use cases to a GORM database.
package engagementrepo

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	engagementdomain "recipehub/internal/domain/engagement"
	eventsdomain "recipehub/internal/domain/events"
	engagementusecase "recipehub/internal/usecase/engagement"

	"github.com/jackc/pgx/v5/pgconn"
	"gorm.io/gorm"
)

const (
	commentsTable     = "comments"
	recipeLikesTable  = "recipe_likes"
	postLikesTable    = "post_likes"
	savedRecipesTable = "saved_recipes"
	outboxEventsTable = "outbox_events"
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

// CreateComment creates a comment and appends the matching integration event atomically.
func (r *Repository) CreateComment(ctx context.Context, comment engagementdomain.Comment, eventType string) (engagementdomain.Comment, error) {
	row := commentRow{
		AuthorID:        comment.AuthorID,
		TargetType:      string(comment.TargetType),
		TargetID:        comment.TargetID,
		ParentCommentID: comment.ParentCommentID,
		Content:         comment.Content,
	}
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&row).Error; err != nil {
			return err
		}

		event, err := eventsdomain.NewEnvelope(eventType, eventsdomain.CommentCreatedPayload{
			TargetID:  row.TargetID,
			CommentID: row.ID,
			AuthorID:  row.AuthorID,
		})
		if err != nil {
			return err
		}

		return appendOutboxEvent(tx, event)
	})
	if err != nil {
		return engagementdomain.Comment{}, err
	}

	return toComment(row), nil
}

// DeleteCommentSubtree deletes a comment and replies, then appends one aggregate deletion event atomically.
func (r *Repository) DeleteCommentSubtree(ctx context.Context, comment engagementdomain.Comment, eventType string) (int64, error) {
	var deleted int64
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		frontier := []uint64{comment.ID}
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

		event, err := eventsdomain.NewEnvelope(eventType, eventsdomain.CommentDeletedPayload{
			TargetID:     comment.TargetID,
			CommentID:    comment.ID,
			DeletedCount: deleted,
		})
		if err != nil {
			return err
		}

		return appendOutboxEvent(tx, event)
	})

	return deleted, err
}

// Like creates a like and appends the matching integration event atomically.
func (r *Repository) Like(ctx context.Context, target engagementdomain.TargetType, userID, targetID uint64, eventType string) error {
	return mapDuplicateKey(r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		switch target {
		case engagementdomain.TargetRecipe:
			if err := tx.Create(&recipeLikeRow{UserID: userID, RecipeID: targetID}).Error; err != nil {
				return err
			}
		case engagementdomain.TargetPost:
			if err := tx.Create(&postLikeRow{UserID: userID, PostID: targetID}).Error; err != nil {
				return err
			}
		default:
			return engagementusecase.ErrInvalidInput
		}

		event, err := eventsdomain.NewEnvelope(eventType, eventsdomain.LikePayload{TargetID: targetID, UserID: userID})
		if err != nil {
			return err
		}

		return appendOutboxEvent(tx, event)
	}))
}

// Unlike deletes a like and appends the matching integration event atomically.
func (r *Repository) Unlike(ctx context.Context, target engagementdomain.TargetType, userID, targetID uint64, eventType string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var result *gorm.DB
		switch target {
		case engagementdomain.TargetRecipe:
			result = tx.Where("user_id = ? AND recipe_id = ?", userID, targetID).Delete(&recipeLikeRow{})
		case engagementdomain.TargetPost:
			result = tx.Where("user_id = ? AND post_id = ?", userID, targetID).Delete(&postLikeRow{})
		default:
			return engagementusecase.ErrInvalidInput
		}
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return engagementusecase.ErrNotFound
		}

		event, err := eventsdomain.NewEnvelope(eventType, eventsdomain.LikePayload{TargetID: targetID, UserID: userID})
		if err != nil {
			return err
		}

		return appendOutboxEvent(tx, event)
	})
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

// LikedIDs returns ids liked by user among target ids.
func (r *Repository) LikedIDs(ctx context.Context, target engagementdomain.TargetType, userID uint64, targetIDs []uint64) (map[uint64]bool, error) {
	out := make(map[uint64]bool, len(targetIDs))
	if len(targetIDs) == 0 {
		return out, nil
	}

	var ids []uint64
	query := r.db.WithContext(ctx).Where("user_id = ?", userID)
	switch target {
	case engagementdomain.TargetRecipe:
		if err := query.Model(&recipeLikeRow{}).Where("recipe_id IN ?", targetIDs).Pluck("recipe_id", &ids).Error; err != nil {
			return nil, err
		}
	case engagementdomain.TargetPost:
		if err := query.Model(&postLikeRow{}).Where("post_id IN ?", targetIDs).Pluck("post_id", &ids).Error; err != nil {
			return nil, err
		}
	default:
		return nil, engagementusecase.ErrInvalidInput
	}

	for _, id := range ids {
		out[id] = true
	}

	return out, nil
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

// SavedRecipeIDs returns recipe ids saved by user among recipe ids.
func (r *Repository) SavedRecipeIDs(ctx context.Context, userID uint64, recipeIDs []uint64) (map[uint64]bool, error) {
	out := make(map[uint64]bool, len(recipeIDs))
	if len(recipeIDs) == 0 {
		return out, nil
	}

	var ids []uint64
	err := r.db.WithContext(ctx).
		Model(&savedRecipeRow{}).
		Where("user_id = ? AND recipe_id IN ?", userID, recipeIDs).
		Pluck("recipe_id", &ids).
		Error
	if err != nil {
		return nil, err
	}

	for _, id := range ids {
		out[id] = true
	}

	return out, nil
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
	stats := make([]engagementdomain.Stat, len(ids))
	if len(ids) == 0 {
		return stats, nil
	}

	uniqueIDs := uniqueUint64(ids)
	likes, err := r.likesCountBatch(ctx, target, uniqueIDs)
	if err != nil {
		return nil, err
	}
	comments, err := r.commentsCountBatch(ctx, target, uniqueIDs)
	if err != nil {
		return nil, err
	}

	for idx, id := range ids {
		stats[idx] = engagementdomain.Stat{
			TargetID:      id,
			LikesCount:    likes[id],
			CommentsCount: comments[id],
		}
	}

	return stats, nil
}

func (r *Repository) likesCountBatch(ctx context.Context, target engagementdomain.TargetType, ids []uint64) (map[uint64]int64, error) {
	out := make(map[uint64]int64, len(ids))
	if len(ids) == 0 {
		return out, nil
	}

	type countRow struct {
		TargetID uint64
		Count    int64
	}
	var rows []countRow
	var err error

	switch target {
	case engagementdomain.TargetRecipe:
		err = r.db.WithContext(ctx).
			Model(&recipeLikeRow{}).
			Select("recipe_id AS target_id, COUNT(*) AS count").
			Where("recipe_id IN ?", ids).
			Group("recipe_id").
			Scan(&rows).
			Error
	case engagementdomain.TargetPost:
		err = r.db.WithContext(ctx).
			Model(&postLikeRow{}).
			Select("post_id AS target_id, COUNT(*) AS count").
			Where("post_id IN ?", ids).
			Group("post_id").
			Scan(&rows).
			Error
	default:
		return nil, engagementusecase.ErrInvalidInput
	}
	if err != nil {
		return nil, err
	}

	for _, row := range rows {
		out[row.TargetID] = row.Count
	}

	return out, nil
}

func (r *Repository) commentsCountBatch(ctx context.Context, target engagementdomain.TargetType, ids []uint64) (map[uint64]int64, error) {
	out := make(map[uint64]int64, len(ids))
	if len(ids) == 0 {
		return out, nil
	}
	if target != engagementdomain.TargetRecipe && target != engagementdomain.TargetPost {
		return nil, engagementusecase.ErrInvalidInput
	}

	type countRow struct {
		TargetID uint64
		Count    int64
	}
	var rows []countRow
	if err := r.db.WithContext(ctx).
		Model(&commentRow{}).
		Select("target_id, COUNT(*) AS count").
		Where("target_type = ? AND target_id IN ?", string(target), ids).
		Group("target_id").
		Scan(&rows).
		Error; err != nil {
		return nil, err
	}

	for _, row := range rows {
		out[row.TargetID] = row.Count
	}

	return out, nil
}

func uniqueUint64(ids []uint64) []uint64 {
	out := make([]uint64, 0, len(ids))
	seen := make(map[uint64]struct{}, len(ids))
	for _, id := range ids {
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}
		out = append(out, id)
	}

	return out
}

// PendingOutboxEvents returns unpublished integration events ordered by creation time.
func (r *Repository) PendingOutboxEvents(ctx context.Context, limit int) ([]eventsdomain.Envelope, error) {
	if limit < 1 {
		limit = 1
	}

	now := time.Now().UTC()
	staleClaim := now.Add(-30 * time.Second)
	var rows []outboxEventRow
	if err := r.db.WithContext(ctx).Raw(`
		UPDATE outbox_events
		SET claimed_at = ?
		WHERE event_id IN (
			SELECT event_id
			FROM outbox_events
			WHERE published_at IS NULL
			  AND (next_attempt_at IS NULL OR next_attempt_at <= ?)
			  AND (claimed_at IS NULL OR claimed_at < ?)
			ORDER BY created_at ASC
			LIMIT ?
			FOR UPDATE SKIP LOCKED
		)
		RETURNING event_id, event_type, occurred_at, payload, claimed_at, published_at, next_attempt_at, attempts, last_error, created_at, updated_at
	`, now, now, staleClaim, limit).Scan(&rows).Error; err != nil {
		return nil, err
	}

	events := make([]eventsdomain.Envelope, 0, len(rows))
	for _, row := range rows {
		events = append(events, outboxEnvelope(row))
	}

	return events, nil
}

// MarkOutboxPublished marks an event as delivered to the broker.
func (r *Repository) MarkOutboxPublished(ctx context.Context, eventID string) error {
	now := time.Now().UTC()
	return r.db.WithContext(ctx).
		Model(&outboxEventRow{}).
		Where("event_id = ?", eventID).
		Updates(map[string]any{
			"published_at":    now,
			"claimed_at":      nil,
			"next_attempt_at": nil,
			"last_error":      nil,
		}).Error
}

// MarkOutboxFailed records a failed publish attempt so the relay can retry later.
func (r *Repository) MarkOutboxFailed(ctx context.Context, eventID string, publishErr error) error {
	message := ""
	if publishErr != nil {
		message = publishErr.Error()
	}

	return r.db.WithContext(ctx).
		Model(&outboxEventRow{}).
		Where("event_id = ?", eventID).
		Updates(map[string]any{
			"attempts":        gorm.Expr("attempts + 1"),
			"claimed_at":      nil,
			"next_attempt_at": gorm.Expr("? + (LEAST(300, POWER(2, LEAST(attempts, 8))::int) * INTERVAL '1 second')", time.Now().UTC()),
			"last_error":      message,
		}).Error
}

func likeQuery(db *gorm.DB, target engagementdomain.TargetType, targetID uint64) *gorm.DB {
	if target == engagementdomain.TargetRecipe {
		return db.Model(&recipeLikeRow{}).Where("recipe_id = ?", targetID)
	}

	return db.Model(&postLikeRow{}).Where("post_id = ?", targetID)
}

func appendOutboxEvent(tx *gorm.DB, event eventsdomain.Envelope) error {
	row := outboxEventRow{
		EventID:    event.EventID,
		EventType:  event.EventType,
		OccurredAt: event.OccurredAt,
		Payload:    append([]byte(nil), event.Payload...),
	}

	return tx.Create(&row).Error
}

func outboxEnvelope(row outboxEventRow) eventsdomain.Envelope {
	return eventsdomain.Envelope{
		EventID:    row.EventID,
		EventType:  row.EventType,
		OccurredAt: row.OccurredAt,
		Payload:    json.RawMessage(append([]byte(nil), row.Payload...)),
	}
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
