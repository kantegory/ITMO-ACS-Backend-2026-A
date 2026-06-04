// Package engagement contains comments, likes and saved recipe domain types.
package engagement

import "time"

// TargetType describes content type for engagement records.
type TargetType string

const (
	// TargetRecipe points to a recipe.
	TargetRecipe TargetType = "recipe"
	// TargetPost points to a blog post.
	TargetPost TargetType = "post"
)

// Comment describes a comment under recipe or post.
type Comment struct {
	ID              uint64
	AuthorID        uint64
	TargetType      TargetType
	TargetID        uint64
	ParentCommentID *uint64
	Content         string
	CreatedAt       time.Time
}

// CommentAuthor contains safe author preview.
type CommentAuthor struct {
	ID          uint64
	Username    string
	DisplayName string
	AvatarURL   *string
}

// CommentThread is a comment with author and nested replies.
type CommentThread struct {
	Comment Comment
	Author  CommentAuthor
	Replies []CommentThread
}

// Stat contains engagement counters for a target.
type Stat struct {
	TargetID      uint64
	LikesCount    int64
	CommentsCount int64
	IsLiked       bool
	IsSaved       bool
}

// SavedRecipe contains a saved recipe reference.
type SavedRecipe struct {
	UserID    uint64
	RecipeID  uint64
	CreatedAt time.Time
}

// RecipeBrief contains short recipe data for saved list.
type RecipeBrief struct {
	ID            uint64
	Title         string
	CoverImageURL *string
	AuthorID      uint64
}

// Page describes paginated engagement results.
type Page[T any] struct {
	Items []T
	Total int64
}
