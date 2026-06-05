// Package blog contains blog post domain types.
package blog

import "time"

// AuthorPreview is the author data needed by blog responses.
type AuthorPreview struct {
	ID          uint64
	Username    string
	DisplayName string
	AvatarURL   *string
}

// Post describes a blog post owned by blog-service.
type Post struct {
	ID            uint64
	AuthorID      uint64
	Title         string
	Content       string
	CoverImageURL *string
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

// PostWithAuthor combines a post and author preview for HTTP responses.
type PostWithAuthor struct {
	Post   Post
	Author AuthorPreview
	Stats  EngagementStats
}

// EngagementStats contains counters owned by engagement-service.
type EngagementStats struct {
	LikesCount    int64
	CommentsCount int64
	IsLiked       bool
}

// Page describes paginated blog results.
type Page[T any] struct {
	Items []T
	Total int64
}
