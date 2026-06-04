package blog

import (
	"time"

	blogdomain "recipehub/internal/domain/blog"
	blogusecase "recipehub/internal/usecase/blog"
)

type createPostRequest struct {
	Title         string  `json:"title"`
	Content       string  `json:"content"`
	CoverImageURL *string `json:"cover_image_url"`
}

type patchPostRequest struct {
	Title         *string `json:"title"`
	Content       *string `json:"content"`
	CoverImageURL *string `json:"cover_image_url"`
}

type userShortResponse struct {
	ID          uint64  `json:"id"`
	Username    string  `json:"username"`
	DisplayName string  `json:"display_name"`
	AvatarURL   *string `json:"avatar_url"`
}

type postListItemResponse struct {
	ID            uint64            `json:"id"`
	Title         string            `json:"title"`
	Content       string            `json:"content"`
	CoverImageURL *string           `json:"cover_image_url"`
	Author        userShortResponse `json:"author"`
	LikesCount    int64             `json:"likes_count"`
	CommentsCount int64             `json:"comments_count"`
	CreatedAt     time.Time         `json:"created_at"`
}

type postFullResponse struct {
	ID            uint64            `json:"id"`
	Title         string            `json:"title"`
	Content       string            `json:"content"`
	CoverImageURL *string           `json:"cover_image_url"`
	Author        userShortResponse `json:"author"`
	LikesCount    int64             `json:"likes_count"`
	CommentsCount int64             `json:"comments_count"`
	IsLiked       bool              `json:"is_liked"`
	CreatedAt     time.Time         `json:"created_at"`
	UpdatedAt     time.Time         `json:"updated_at"`
}

type postBriefResponse struct {
	ID       uint64 `json:"id"`
	Title    string `json:"title"`
	AuthorID uint64 `json:"author_id"`
}

type existsResponse struct {
	Exists bool `json:"exists"`
}

func toCreateInput(req createPostRequest, authorID uint64) blogusecase.CreatePostInput {
	return blogusecase.CreatePostInput{
		AuthorID:      authorID,
		Title:         req.Title,
		Content:       req.Content,
		CoverImageURL: req.CoverImageURL,
	}
}

func toPatchInput(req patchPostRequest, actorID uint64) blogusecase.PatchPostInput {
	return blogusecase.PatchPostInput{
		ActorID:       actorID,
		Title:         req.Title,
		Content:       req.Content,
		CoverImageURL: req.CoverImageURL,
	}
}

func toPostListItemResponse(item blogdomain.PostWithAuthor) postListItemResponse {
	return postListItemResponse{
		ID:            item.Post.ID,
		Title:         item.Post.Title,
		Content:       item.Post.Content,
		CoverImageURL: item.Post.CoverImageURL,
		Author:        toUserShortResponse(item.Author),
		LikesCount:    0,
		CommentsCount: 0,
		CreatedAt:     item.Post.CreatedAt,
	}
}

func toPostFullResponse(item blogdomain.PostWithAuthor) postFullResponse {
	return postFullResponse{
		ID:            item.Post.ID,
		Title:         item.Post.Title,
		Content:       item.Post.Content,
		CoverImageURL: item.Post.CoverImageURL,
		Author:        toUserShortResponse(item.Author),
		LikesCount:    0,
		CommentsCount: 0,
		IsLiked:       false,
		CreatedAt:     item.Post.CreatedAt,
		UpdatedAt:     item.Post.UpdatedAt,
	}
}

func toUserShortResponse(author blogdomain.AuthorPreview) userShortResponse {
	return userShortResponse{
		ID:          author.ID,
		Username:    author.Username,
		DisplayName: author.DisplayName,
		AvatarURL:   author.AvatarURL,
	}
}

func toPostBriefResponse(post blogdomain.Post) postBriefResponse {
	return postBriefResponse{
		ID:       post.ID,
		Title:    post.Title,
		AuthorID: post.AuthorID,
	}
}
