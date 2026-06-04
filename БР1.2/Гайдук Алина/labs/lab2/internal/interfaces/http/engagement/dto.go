package engagement

import (
	"time"

	engagementdomain "recipehub/internal/domain/engagement"
)

type createCommentRequest struct {
	Content         string  `json:"content"`
	ParentCommentID *uint64 `json:"parent_comment_id"`
}

type userShortResponse struct {
	ID          uint64  `json:"id"`
	Username    string  `json:"username"`
	DisplayName string  `json:"display_name"`
	AvatarURL   *string `json:"avatar_url"`
}

type commentResponse struct {
	ID              uint64            `json:"id"`
	Author          userShortResponse `json:"author"`
	Content         string            `json:"content"`
	ParentCommentID *uint64           `json:"parent_comment_id"`
	Replies         []commentResponse `json:"replies,omitempty"`
	CreatedAt       time.Time         `json:"created_at"`
}

type likedResponse struct {
	Liked      bool  `json:"liked"`
	LikesCount int64 `json:"likes_count"`
}

type savedResponse struct {
	Saved bool `json:"saved"`
}

type recipeBriefResponse struct {
	ID            uint64  `json:"id"`
	Title         string  `json:"title"`
	CoverImageURL *string `json:"cover_image_url"`
	AuthorID      uint64  `json:"author_id"`
}

type recipeStatsBatchRequest struct {
	RecipeIDs []uint64 `json:"recipe_ids"`
	ViewerID  *uint64  `json:"viewer_id"`
}

type postStatsBatchRequest struct {
	PostIDs  []uint64 `json:"post_ids"`
	ViewerID *uint64  `json:"viewer_id"`
}

type recipeStatsItemResponse struct {
	RecipeID      uint64 `json:"recipe_id"`
	LikesCount    int64  `json:"likes_count"`
	CommentsCount int64  `json:"comments_count"`
	IsLiked       bool   `json:"is_liked"`
	IsSaved       bool   `json:"is_saved"`
}

type postStatsItemResponse struct {
	PostID        uint64 `json:"post_id"`
	LikesCount    int64  `json:"likes_count"`
	CommentsCount int64  `json:"comments_count"`
	IsLiked       bool   `json:"is_liked"`
}

func toCommentResponse(thread engagementdomain.CommentThread) commentResponse {
	replies := make([]commentResponse, 0, len(thread.Replies))
	for _, reply := range thread.Replies {
		replies = append(replies, toCommentResponse(reply))
	}

	return commentResponse{
		ID: thread.Comment.ID,
		Author: userShortResponse{
			ID:          thread.Author.ID,
			Username:    thread.Author.Username,
			DisplayName: thread.Author.DisplayName,
			AvatarURL:   thread.Author.AvatarURL,
		},
		Content:         thread.Comment.Content,
		ParentCommentID: thread.Comment.ParentCommentID,
		Replies:         replies,
		CreatedAt:       thread.Comment.CreatedAt,
	}
}

func toRecipeBriefResponse(recipe engagementdomain.RecipeBrief) recipeBriefResponse {
	return recipeBriefResponse{
		ID:            recipe.ID,
		Title:         recipe.Title,
		CoverImageURL: recipe.CoverImageURL,
		AuthorID:      recipe.AuthorID,
	}
}
