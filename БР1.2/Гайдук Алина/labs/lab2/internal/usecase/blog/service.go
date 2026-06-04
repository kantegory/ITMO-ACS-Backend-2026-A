// Package blog implements blog application scenarios.
package blog

import (
	"context"
	"errors"
	"fmt"
	"strings"

	blogdomain "recipehub/internal/domain/blog"
	identitydomain "recipehub/internal/domain/identity"
)

const titleMaxLen = 255

// Application-level blog errors.
var (
	ErrInvalidInput = errors.New("invalid blog input")
	ErrNotFound     = errors.New("blog entity not found")
	ErrForbidden    = errors.New("blog action forbidden")
)

// Repository is the persistence port required by blog use cases.
type Repository interface {
	CreatePost(ctx context.Context, post blogdomain.Post) (blogdomain.Post, error)
	PostByID(ctx context.Context, id uint64) (blogdomain.Post, error)
	ListPosts(ctx context.Context, limit, offset int) (blogdomain.Page[blogdomain.Post], error)
	ListPostsByAuthor(ctx context.Context, authorID uint64, limit, offset int) (blogdomain.Page[blogdomain.Post], error)
	UpdatePost(ctx context.Context, post blogdomain.Post) (blogdomain.Post, error)
	DeletePost(ctx context.Context, id uint64) error
	PostExists(ctx context.Context, id uint64) (bool, error)
}

// IdentityGateway is the identity-service port required by blog use cases.
type IdentityGateway interface {
	UserExists(ctx context.Context, userID uint64) (bool, error)
	UsersBatch(ctx context.Context, ids []uint64) ([]identitydomain.UserShort, error)
}

// Service coordinates blog application scenarios.
type Service struct {
	repo     Repository
	identity IdentityGateway
}

// NewService creates blog use cases.
func NewService(repo Repository, identity IdentityGateway) *Service {
	return &Service{repo: repo, identity: identity}
}

// CreatePostInput contains post creation data.
type CreatePostInput struct {
	AuthorID      uint64
	Title         string
	Content       string
	CoverImageURL *string
}

// PatchPostInput contains optional post updates.
type PatchPostInput struct {
	ActorID       uint64
	Title         *string
	Content       *string
	CoverImageURL *string
}

// CreatePost validates and creates a blog post.
func (s *Service) CreatePost(ctx context.Context, input CreatePostInput) (blogdomain.PostWithAuthor, error) {
	title, content, err := normalizePostText(input.Title, input.Content)
	if err != nil {
		return blogdomain.PostWithAuthor{}, err
	}

	if ok, err := s.identity.UserExists(ctx, input.AuthorID); err != nil || !ok {
		return blogdomain.PostWithAuthor{}, notFoundOrWrapped(err)
	}

	post, err := s.repo.CreatePost(ctx, blogdomain.Post{
		AuthorID:      input.AuthorID,
		Title:         title,
		Content:       content,
		CoverImageURL: input.CoverImageURL,
	})
	if err != nil {
		return blogdomain.PostWithAuthor{}, fmt.Errorf("create post: %w", err)
	}

	return s.attachAuthor(ctx, post)
}

// GetPost returns a post by id.
func (s *Service) GetPost(ctx context.Context, id uint64) (blogdomain.PostWithAuthor, error) {
	post, err := s.repo.PostByID(ctx, id)
	if err != nil {
		return blogdomain.PostWithAuthor{}, err
	}

	return s.attachAuthor(ctx, post)
}

// ListPosts returns paginated posts.
func (s *Service) ListPosts(ctx context.Context, limit, offset int) (blogdomain.Page[blogdomain.PostWithAuthor], error) {
	page, err := s.repo.ListPosts(ctx, limit, offset)
	if err != nil {
		return blogdomain.Page[blogdomain.PostWithAuthor]{}, err
	}

	items, err := s.attachAuthors(ctx, page.Items)
	if err != nil {
		return blogdomain.Page[blogdomain.PostWithAuthor]{}, err
	}

	return blogdomain.Page[blogdomain.PostWithAuthor]{Items: items, Total: page.Total}, nil
}

// ListPostsByAuthor returns paginated posts for an author.
func (s *Service) ListPostsByAuthor(ctx context.Context, authorID uint64, limit, offset int) (blogdomain.Page[blogdomain.PostWithAuthor], error) {
	if ok, err := s.identity.UserExists(ctx, authorID); err != nil || !ok {
		return blogdomain.Page[blogdomain.PostWithAuthor]{}, notFoundOrWrapped(err)
	}

	page, err := s.repo.ListPostsByAuthor(ctx, authorID, limit, offset)
	if err != nil {
		return blogdomain.Page[blogdomain.PostWithAuthor]{}, err
	}

	items, err := s.attachAuthors(ctx, page.Items)
	if err != nil {
		return blogdomain.Page[blogdomain.PostWithAuthor]{}, err
	}

	return blogdomain.Page[blogdomain.PostWithAuthor]{Items: items, Total: page.Total}, nil
}

// PatchPost updates a post if actor is the author.
func (s *Service) PatchPost(ctx context.Context, postID uint64, input PatchPostInput) (blogdomain.PostWithAuthor, error) {
	post, err := s.repo.PostByID(ctx, postID)
	if err != nil {
		return blogdomain.PostWithAuthor{}, err
	}
	if post.AuthorID != input.ActorID {
		return blogdomain.PostWithAuthor{}, ErrForbidden
	}

	if input.Title != nil {
		title := strings.TrimSpace(*input.Title)
		if title == "" || len(title) > titleMaxLen {
			return blogdomain.PostWithAuthor{}, ErrInvalidInput
		}
		post.Title = title
	}
	if input.Content != nil {
		content := strings.TrimSpace(*input.Content)
		if content == "" {
			return blogdomain.PostWithAuthor{}, ErrInvalidInput
		}
		post.Content = content
	}
	if input.CoverImageURL != nil {
		post.CoverImageURL = input.CoverImageURL
	}

	updated, err := s.repo.UpdatePost(ctx, post)
	if err != nil {
		return blogdomain.PostWithAuthor{}, fmt.Errorf("update post: %w", err)
	}

	return s.attachAuthor(ctx, updated)
}

// DeletePost deletes a post if actor is the author.
func (s *Service) DeletePost(ctx context.Context, postID, actorID uint64) error {
	post, err := s.repo.PostByID(ctx, postID)
	if err != nil {
		return err
	}
	if post.AuthorID != actorID {
		return ErrForbidden
	}

	return s.repo.DeletePost(ctx, postID)
}

// PostExists reports whether a post exists.
func (s *Service) PostExists(ctx context.Context, postID uint64) (bool, error) {
	return s.repo.PostExists(ctx, postID)
}

// PostBrief returns a short post card for internal consumers.
func (s *Service) PostBrief(ctx context.Context, postID uint64) (blogdomain.Post, error) {
	return s.repo.PostByID(ctx, postID)
}

func (s *Service) attachAuthor(ctx context.Context, post blogdomain.Post) (blogdomain.PostWithAuthor, error) {
	items, err := s.attachAuthors(ctx, []blogdomain.Post{post})
	if err != nil {
		return blogdomain.PostWithAuthor{}, err
	}
	if len(items) == 0 {
		return blogdomain.PostWithAuthor{}, ErrNotFound
	}

	return items[0], nil
}

func (s *Service) attachAuthors(ctx context.Context, posts []blogdomain.Post) ([]blogdomain.PostWithAuthor, error) {
	ids := uniqueAuthorIDs(posts)
	users, err := s.identity.UsersBatch(ctx, ids)
	if err != nil {
		return nil, fmt.Errorf("load post authors: %w", err)
	}

	authors := make(map[uint64]blogdomain.AuthorPreview, len(users))
	for _, user := range users {
		authors[user.ID] = blogdomain.AuthorPreview{
			ID:          user.ID,
			Username:    user.Username,
			DisplayName: user.DisplayName,
			AvatarURL:   user.AvatarURL,
		}
	}

	out := make([]blogdomain.PostWithAuthor, 0, len(posts))
	for _, post := range posts {
		out = append(out, blogdomain.PostWithAuthor{
			Post:   post,
			Author: authors[post.AuthorID],
		})
	}

	return out, nil
}

func normalizePostText(title, content string) (string, string, error) {
	title = strings.TrimSpace(title)
	content = strings.TrimSpace(content)
	if title == "" || len(title) > titleMaxLen || content == "" {
		return "", "", ErrInvalidInput
	}

	return title, content, nil
}

func uniqueAuthorIDs(posts []blogdomain.Post) []uint64 {
	out := make([]uint64, 0, len(posts))
	seen := make(map[uint64]struct{}, len(posts))
	for _, post := range posts {
		if _, ok := seen[post.AuthorID]; ok {
			continue
		}
		seen[post.AuthorID] = struct{}{}
		out = append(out, post.AuthorID)
	}

	return out
}

func notFoundOrWrapped(err error) error {
	if err == nil {
		return ErrNotFound
	}

	return err
}
