// Package blogrepo adapts blog use cases to a GORM database.
package blogrepo

import (
	"context"
	"errors"

	blogdomain "recipehub/internal/domain/blog"
	blogusecase "recipehub/internal/usecase/blog"

	"gorm.io/gorm"
)

const postsTable = "posts"

var _ blogusecase.Repository = (*Repository)(nil)

// Repository stores blog data in PostgreSQL via GORM.
type Repository struct {
	db *gorm.DB
}

// New creates a blog repository adapter.
func New(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

// CreatePost creates a post.
func (r *Repository) CreatePost(ctx context.Context, post blogdomain.Post) (blogdomain.Post, error) {
	row := toPostRow(post)
	if err := r.db.WithContext(ctx).Create(&row).Error; err != nil {
		return blogdomain.Post{}, err
	}

	return toDomainPost(row), nil
}

// PostByID returns a post by id.
func (r *Repository) PostByID(ctx context.Context, id uint64) (blogdomain.Post, error) {
	var row postRow
	if err := r.db.WithContext(ctx).First(&row, id).Error; err != nil {
		return blogdomain.Post{}, mapNotFound(err)
	}

	return toDomainPost(row), nil
}

// ListPosts returns paginated posts.
func (r *Repository) ListPosts(ctx context.Context, limit, offset int) (blogdomain.Page[blogdomain.Post], error) {
	return r.list(ctx, r.db.WithContext(ctx).Model(&postRow{}), limit, offset)
}

// ListPostsByAuthor returns paginated posts for author.
func (r *Repository) ListPostsByAuthor(ctx context.Context, authorID uint64, limit, offset int) (blogdomain.Page[blogdomain.Post], error) {
	query := r.db.WithContext(ctx).Model(&postRow{}).Where("author_id = ?", authorID)
	return r.list(ctx, query, limit, offset)
}

// UpdatePost updates a post.
func (r *Repository) UpdatePost(ctx context.Context, post blogdomain.Post) (blogdomain.Post, error) {
	row := toPostRow(post)
	if err := r.db.WithContext(ctx).Save(&row).Error; err != nil {
		return blogdomain.Post{}, err
	}

	return toDomainPost(row), nil
}

// DeletePost deletes a post.
func (r *Repository) DeletePost(ctx context.Context, id uint64) error {
	return r.db.WithContext(ctx).Delete(&postRow{}, id).Error
}

// PostExists checks whether a post exists.
func (r *Repository) PostExists(ctx context.Context, id uint64) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&postRow{}).Where("id = ?", id).Count(&count).Error
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func (r *Repository) list(_ context.Context, query *gorm.DB, limit, offset int) (blogdomain.Page[blogdomain.Post], error) {
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return blogdomain.Page[blogdomain.Post]{}, err
	}

	var rows []postRow
	err := query.
		Order("created_at DESC").
		Limit(normalizeLimit(limit)).
		Offset(normalizeOffset(offset)).
		Find(&rows).
		Error
	if err != nil {
		return blogdomain.Page[blogdomain.Post]{}, err
	}

	out := make([]blogdomain.Post, 0, len(rows))
	for _, row := range rows {
		out = append(out, toDomainPost(row))
	}

	return blogdomain.Page[blogdomain.Post]{Items: out, Total: total}, nil
}

func mapNotFound(err error) error {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return blogusecase.ErrNotFound
	}

	return err
}

func toDomainPost(row postRow) blogdomain.Post {
	return blogdomain.Post{
		ID:            row.ID,
		AuthorID:      row.AuthorID,
		Title:         row.Title,
		Content:       row.Content,
		CoverImageURL: row.CoverImageURL,
		CreatedAt:     row.CreatedAt,
		UpdatedAt:     row.UpdatedAt,
	}
}

func toPostRow(post blogdomain.Post) postRow {
	return postRow{
		ID:            post.ID,
		AuthorID:      post.AuthorID,
		Title:         post.Title,
		Content:       post.Content,
		CoverImageURL: post.CoverImageURL,
		CreatedAt:     post.CreatedAt,
		UpdatedAt:     post.UpdatedAt,
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
