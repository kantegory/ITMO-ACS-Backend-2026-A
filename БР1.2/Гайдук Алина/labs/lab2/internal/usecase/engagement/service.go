// Package engagement implements engagement application scenarios.
package engagement

import (
	"context"
	"errors"
	"fmt"
	"strings"

	engagementdomain "recipehub/internal/domain/engagement"
	identitydomain "recipehub/internal/domain/identity"
	recipedomain "recipehub/internal/domain/recipe"
)

// Application-level engagement errors.
var (
	ErrInvalidInput  = errors.New("invalid engagement input")
	ErrNotFound      = errors.New("engagement entity not found")
	ErrForbidden     = errors.New("engagement action forbidden")
	ErrAlreadyExists = errors.New("engagement record already exists")
)

// Repository is the persistence port required by engagement use cases.
type Repository interface {
	ListComments(ctx context.Context, target engagementdomain.TargetType, targetID uint64, limit, offset int) (engagementdomain.Page[engagementdomain.Comment], error)
	CommentDescendants(ctx context.Context, target engagementdomain.TargetType, targetID uint64, rootIDs []uint64) ([]engagementdomain.Comment, error)
	CommentByID(ctx context.Context, id uint64) (engagementdomain.Comment, error)
	CreateComment(ctx context.Context, comment engagementdomain.Comment) (engagementdomain.Comment, error)
	DeleteCommentSubtree(ctx context.Context, id uint64) error

	Like(ctx context.Context, target engagementdomain.TargetType, userID, targetID uint64) error
	Unlike(ctx context.Context, target engagementdomain.TargetType, userID, targetID uint64) error
	LikesCount(ctx context.Context, target engagementdomain.TargetType, targetID uint64) (int64, error)
	IsLiked(ctx context.Context, target engagementdomain.TargetType, userID, targetID uint64) (bool, error)

	SaveRecipe(ctx context.Context, userID, recipeID uint64) error
	UnsaveRecipe(ctx context.Context, userID, recipeID uint64) error
	IsSaved(ctx context.Context, userID, recipeID uint64) (bool, error)
	ListSavedRecipes(ctx context.Context, userID uint64, limit, offset int) (engagementdomain.Page[engagementdomain.SavedRecipe], error)

	StatsBatch(ctx context.Context, target engagementdomain.TargetType, ids []uint64) ([]engagementdomain.Stat, error)
}

// IdentityGateway is the identity-service port required by engagement use cases.
type IdentityGateway interface {
	UsersBatch(ctx context.Context, ids []uint64) ([]identitydomain.UserShort, error)
}

// RecipeGateway is the recipe-service port required by engagement use cases.
type RecipeGateway interface {
	RecipeExists(ctx context.Context, recipeID uint64) (bool, error)
	RecipeBrief(ctx context.Context, recipeID uint64) (recipedomain.Recipe, error)
}

// BlogGateway is the blog-service port required by engagement use cases.
type BlogGateway interface {
	PostExists(ctx context.Context, postID uint64) (bool, error)
}

// Service coordinates engagement application scenarios.
type Service struct {
	repo     Repository
	identity IdentityGateway
	recipe   RecipeGateway
	blog     BlogGateway
}

// NewService creates engagement use cases.
func NewService(repo Repository, identity IdentityGateway, recipe RecipeGateway, blog BlogGateway) *Service {
	return &Service{repo: repo, identity: identity, recipe: recipe, blog: blog}
}

// ListComments returns paginated comments with nested replies.
func (s *Service) ListComments(ctx context.Context, target engagementdomain.TargetType, targetID uint64, limit, offset int) (engagementdomain.Page[engagementdomain.CommentThread], error) {
	if err := s.ensureTargetExists(ctx, target, targetID); err != nil {
		return engagementdomain.Page[engagementdomain.CommentThread]{}, err
	}

	page, err := s.repo.ListComments(ctx, target, targetID, limit, offset)
	if err != nil {
		return engagementdomain.Page[engagementdomain.CommentThread]{}, err
	}

	rootIDs := make([]uint64, 0, len(page.Items))
	for _, comment := range page.Items {
		rootIDs = append(rootIDs, comment.ID)
	}

	descendants, err := s.repo.CommentDescendants(ctx, target, targetID, rootIDs)
	if err != nil {
		return engagementdomain.Page[engagementdomain.CommentThread]{}, err
	}

	threads, err := s.buildThreads(ctx, page.Items, descendants)
	if err != nil {
		return engagementdomain.Page[engagementdomain.CommentThread]{}, err
	}

	return engagementdomain.Page[engagementdomain.CommentThread]{Items: threads, Total: page.Total}, nil
}

// CreateComment creates a comment under recipe or post.
func (s *Service) CreateComment(ctx context.Context, target engagementdomain.TargetType, targetID, authorID uint64, content string, parentID *uint64) (engagementdomain.CommentThread, error) {
	if err := s.ensureTargetExists(ctx, target, targetID); err != nil {
		return engagementdomain.CommentThread{}, err
	}

	content = strings.TrimSpace(content)
	if content == "" {
		return engagementdomain.CommentThread{}, ErrInvalidInput
	}

	if parentID != nil {
		parent, err := s.repo.CommentByID(ctx, *parentID)
		if err != nil {
			return engagementdomain.CommentThread{}, err
		}
		if parent.TargetType != target || parent.TargetID != targetID {
			return engagementdomain.CommentThread{}, ErrNotFound
		}
	}

	comment, err := s.repo.CreateComment(ctx, engagementdomain.Comment{
		AuthorID:        authorID,
		TargetType:      target,
		TargetID:        targetID,
		ParentCommentID: parentID,
		Content:         content,
	})
	if err != nil {
		return engagementdomain.CommentThread{}, err
	}

	threads, err := s.buildThreads(ctx, []engagementdomain.Comment{comment}, nil)
	if err != nil {
		return engagementdomain.CommentThread{}, err
	}

	return threads[0], nil
}

// DeleteComment deletes a comment subtree if actor is author.
func (s *Service) DeleteComment(ctx context.Context, commentID, actorID uint64) error {
	comment, err := s.repo.CommentByID(ctx, commentID)
	if err != nil {
		return err
	}
	if comment.AuthorID != actorID {
		return ErrForbidden
	}

	return s.repo.DeleteCommentSubtree(ctx, commentID)
}

// Like adds a like and returns updated count.
func (s *Service) Like(ctx context.Context, target engagementdomain.TargetType, userID, targetID uint64) (int64, error) {
	if err := s.ensureTargetExists(ctx, target, targetID); err != nil {
		return 0, err
	}
	if err := s.repo.Like(ctx, target, userID, targetID); err != nil {
		return 0, err
	}

	return s.repo.LikesCount(ctx, target, targetID)
}

// Unlike removes a like and returns updated count.
func (s *Service) Unlike(ctx context.Context, target engagementdomain.TargetType, userID, targetID uint64) (int64, error) {
	if err := s.ensureTargetExists(ctx, target, targetID); err != nil {
		return 0, err
	}
	if err := s.repo.Unlike(ctx, target, userID, targetID); err != nil {
		return 0, err
	}

	return s.repo.LikesCount(ctx, target, targetID)
}

// SaveRecipe saves a recipe for a user.
func (s *Service) SaveRecipe(ctx context.Context, userID, recipeID uint64) error {
	if err := s.ensureTargetExists(ctx, engagementdomain.TargetRecipe, recipeID); err != nil {
		return err
	}

	return s.repo.SaveRecipe(ctx, userID, recipeID)
}

// UnsaveRecipe removes a saved recipe.
func (s *Service) UnsaveRecipe(ctx context.Context, userID, recipeID uint64) error {
	if err := s.ensureTargetExists(ctx, engagementdomain.TargetRecipe, recipeID); err != nil {
		return err
	}

	return s.repo.UnsaveRecipe(ctx, userID, recipeID)
}

// ListSavedRecipes returns saved recipe brief cards.
func (s *Service) ListSavedRecipes(ctx context.Context, userID uint64, limit, offset int) (engagementdomain.Page[engagementdomain.RecipeBrief], error) {
	page, err := s.repo.ListSavedRecipes(ctx, userID, limit, offset)
	if err != nil {
		return engagementdomain.Page[engagementdomain.RecipeBrief]{}, err
	}

	items := make([]engagementdomain.RecipeBrief, 0, len(page.Items))
	for _, saved := range page.Items {
		recipe, err := s.recipe.RecipeBrief(ctx, saved.RecipeID)
		if err != nil {
			return engagementdomain.Page[engagementdomain.RecipeBrief]{}, fmt.Errorf("load saved recipe brief: %w", err)
		}
		items = append(items, engagementdomain.RecipeBrief{
			ID:            recipe.ID,
			Title:         recipe.Title,
			CoverImageURL: recipe.CoverImageURL,
			AuthorID:      recipe.AuthorID,
		})
	}

	return engagementdomain.Page[engagementdomain.RecipeBrief]{Items: items, Total: page.Total}, nil
}

// StatsBatch returns likes/comments counts and optional viewer flags for ids.
func (s *Service) StatsBatch(ctx context.Context, target engagementdomain.TargetType, ids []uint64, viewerID *uint64) ([]engagementdomain.Stat, error) {
	stats, err := s.repo.StatsBatch(ctx, target, ids)
	if err != nil || viewerID == nil {
		return stats, err
	}

	for idx := range stats {
		liked, err := s.repo.IsLiked(ctx, target, *viewerID, stats[idx].TargetID)
		if err != nil {
			return nil, err
		}
		stats[idx].IsLiked = liked

		if target == engagementdomain.TargetRecipe {
			saved, err := s.repo.IsSaved(ctx, *viewerID, stats[idx].TargetID)
			if err != nil {
				return nil, err
			}
			stats[idx].IsSaved = saved
		}
	}

	return stats, nil
}

func (s *Service) ensureTargetExists(ctx context.Context, target engagementdomain.TargetType, targetID uint64) error {
	var exists bool
	var err error

	switch target {
	case engagementdomain.TargetRecipe:
		exists, err = s.recipe.RecipeExists(ctx, targetID)
	case engagementdomain.TargetPost:
		exists, err = s.blog.PostExists(ctx, targetID)
	default:
		return ErrInvalidInput
	}
	if err != nil {
		return fmt.Errorf("check target exists: %w", err)
	}
	if !exists {
		return ErrNotFound
	}

	return nil
}

func (s *Service) buildThreads(ctx context.Context, roots, descendants []engagementdomain.Comment) ([]engagementdomain.CommentThread, error) {
	all := append(append([]engagementdomain.Comment{}, roots...), descendants...)
	authors, err := s.loadAuthors(ctx, all)
	if err != nil {
		return nil, err
	}

	byParent := map[uint64][]engagementdomain.Comment{}
	for _, comment := range descendants {
		if comment.ParentCommentID == nil {
			continue
		}
		byParent[*comment.ParentCommentID] = append(byParent[*comment.ParentCommentID], comment)
	}

	out := make([]engagementdomain.CommentThread, 0, len(roots))
	for _, root := range roots {
		out = append(out, buildThread(root, byParent, authors))
	}

	return out, nil
}

func (s *Service) loadAuthors(ctx context.Context, comments []engagementdomain.Comment) (map[uint64]engagementdomain.CommentAuthor, error) {
	ids := make([]uint64, 0, len(comments))
	seen := map[uint64]struct{}{}
	for _, comment := range comments {
		if _, ok := seen[comment.AuthorID]; ok {
			continue
		}
		seen[comment.AuthorID] = struct{}{}
		ids = append(ids, comment.AuthorID)
	}

	users, err := s.identity.UsersBatch(ctx, ids)
	if err != nil {
		return nil, fmt.Errorf("load comment authors: %w", err)
	}

	out := make(map[uint64]engagementdomain.CommentAuthor, len(users))
	for _, user := range users {
		out[user.ID] = engagementdomain.CommentAuthor{
			ID:          user.ID,
			Username:    user.Username,
			DisplayName: user.DisplayName,
			AvatarURL:   user.AvatarURL,
		}
	}

	return out, nil
}

func buildThread(comment engagementdomain.Comment, byParent map[uint64][]engagementdomain.Comment, authors map[uint64]engagementdomain.CommentAuthor) engagementdomain.CommentThread {
	children := byParent[comment.ID]
	replies := make([]engagementdomain.CommentThread, 0, len(children))
	for _, child := range children {
		replies = append(replies, buildThread(child, byParent, authors))
	}

	return engagementdomain.CommentThread{
		Comment: comment,
		Author:  authors[comment.AuthorID],
		Replies: replies,
	}
}
