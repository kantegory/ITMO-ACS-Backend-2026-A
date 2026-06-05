// Package identity implements identity application scenarios.
package identity

import (
	"context"
	"errors"
	"fmt"
	"net/mail"
	"strings"
	"time"

	identitydomain "recipehub/internal/domain/identity"

	"golang.org/x/crypto/bcrypt"
)

const (
	usernameMinLen    = 3
	usernameMaxLen    = 100
	passwordMinLen    = 8
	displayNameMaxLen = 100
)

// Application-level identity errors.
var (
	ErrInvalidInput       = errors.New("invalid identity input")
	ErrEmailExists        = errors.New("email already exists")
	ErrUsernameExists     = errors.New("username already exists")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrInvalidRefresh     = errors.New("invalid refresh token")
	ErrNotFound           = errors.New("identity entity not found")
	ErrSelfFollow         = errors.New("cannot follow self")
	ErrAlreadyFollowing   = errors.New("already following")
)

// Repository is the persistence port required by identity use cases.
type Repository interface {
	UserByID(ctx context.Context, id uint64) (identitydomain.User, error)
	UserByEmail(ctx context.Context, email string) (identitydomain.User, error)
	UsersByIDs(ctx context.Context, ids []uint64) ([]identitydomain.User, error)
	CreateUser(ctx context.Context, user identitydomain.User) (identitydomain.User, error)
	UpdateUser(ctx context.Context, user identitydomain.User) (identitydomain.User, error)
	EmailExists(ctx context.Context, email string) (bool, error)
	UsernameExists(ctx context.Context, username string) (bool, error)

	CreateRefreshToken(ctx context.Context, token identitydomain.RefreshToken) error
	RefreshTokenByHash(ctx context.Context, hash string) (identitydomain.RefreshToken, error)
	DeleteRefreshTokenByHash(ctx context.Context, hash string) error

	FollowersCount(ctx context.Context, userID uint64) (int64, error)
	FollowingCount(ctx context.Context, userID uint64) (int64, error)
	ListFollowers(ctx context.Context, userID uint64, limit, offset int) (identitydomain.Page[identitydomain.FollowUser], error)
	ListFollowing(ctx context.Context, userID uint64, limit, offset int) (identitydomain.Page[identitydomain.FollowUser], error)
	FollowExists(ctx context.Context, followerID, followingID uint64) (bool, error)
	CreateFollow(ctx context.Context, follow identitydomain.Follow) error
	DeleteFollow(ctx context.Context, followerID, followingID uint64) error
}

// TokenManager issues and hashes access/refresh tokens.
type TokenManager interface {
	IssueAccessToken(userID uint64, ttl time.Duration) (string, error)
	RandomRefreshToken() (string, error)
	HashRefreshToken(raw string) string
}

// RecipeGateway is the recipe-service port required by identity use cases.
type RecipeGateway interface {
	AuthorRecipeCount(ctx context.Context, authorID uint64) (int64, error)
}

// Config contains identity use case settings.
type Config struct {
	AccessTTLSeconds  int
	RefreshTTLSeconds int
}

// Service coordinates identity application scenarios.
type Service struct {
	repo   Repository
	tokens TokenManager
	cfg    Config
	recipe RecipeGateway
}

// NewService creates identity use cases.
func NewService(repo Repository, tokens TokenManager, cfg Config, recipe RecipeGateway) *Service {
	return &Service{repo: repo, tokens: tokens, cfg: cfg, recipe: recipe}
}

// RegisterInput contains registration data.
type RegisterInput struct {
	Email       string
	Username    string
	Password    string
	DisplayName string
}

// LoginInput contains login data.
type LoginInput struct {
	Email    string
	Password string
}

// PatchProfileInput contains optional profile updates.
type PatchProfileInput struct {
	DisplayName *string
	Bio         *string
	AvatarURL   *string
}

// TokenPair contains issued JWT and refresh token.
type TokenPair struct {
	AccessToken  string
	RefreshToken string
	ExpiresIn    int
}

// Register creates a user and issues tokens.
func (s *Service) Register(ctx context.Context, input RegisterInput) (TokenPair, error) {
	normalized, err := normalizeRegister(input)
	if err != nil {
		return TokenPair{}, err
	}

	if err := s.ensureUniqueUser(ctx, normalized.Email, normalized.Username); err != nil {
		return TokenPair{}, err
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(normalized.Password), bcrypt.DefaultCost)
	if err != nil {
		return TokenPair{}, fmt.Errorf("hash password: %w", err)
	}

	user, err := s.repo.CreateUser(ctx, identitydomain.User{
		Email:        normalized.Email,
		Username:     normalized.Username,
		PasswordHash: string(hash),
		DisplayName:  normalized.DisplayName,
	})
	if err != nil {
		return TokenPair{}, fmt.Errorf("create user: %w", err)
	}

	return s.issueTokenPair(ctx, user.ID)
}

// Login checks credentials and issues tokens.
func (s *Service) Login(ctx context.Context, input LoginInput) (TokenPair, error) {
	email := strings.TrimSpace(strings.ToLower(input.Email))
	if email == "" || input.Password == "" {
		return TokenPair{}, ErrInvalidInput
	}

	user, err := s.repo.UserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			return TokenPair{}, ErrInvalidCredentials
		}
		return TokenPair{}, fmt.Errorf("load user by email: %w", err)
	}

	if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)) != nil {
		return TokenPair{}, ErrInvalidCredentials
	}

	return s.issueTokenPair(ctx, user.ID)
}

// Refresh rotates a refresh token and issues a new pair.
func (s *Service) Refresh(ctx context.Context, refreshToken string) (TokenPair, error) {
	raw := strings.TrimSpace(refreshToken)
	if raw == "" {
		return TokenPair{}, ErrInvalidRefresh
	}

	hash := s.tokens.HashRefreshToken(raw)
	stored, err := s.repo.RefreshTokenByHash(ctx, hash)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			return TokenPair{}, ErrInvalidRefresh
		}
		return TokenPair{}, fmt.Errorf("load refresh token: %w", err)
	}
	if time.Now().UTC().After(stored.ExpiresAt.UTC()) {
		return TokenPair{}, ErrInvalidRefresh
	}

	pair, err := s.issueTokenPair(ctx, stored.UserID)
	if err != nil {
		return TokenPair{}, err
	}
	if err := s.repo.DeleteRefreshTokenByHash(ctx, hash); err != nil {
		return TokenPair{}, fmt.Errorf("delete old refresh token: %w", err)
	}

	return pair, nil
}

// UserProfile returns a public user profile.
func (s *Service) UserProfile(ctx context.Context, userID uint64) (identitydomain.User, int64, int64, int64, error) {
	user, err := s.repo.UserByID(ctx, userID)
	if err != nil {
		return identitydomain.User{}, 0, 0, 0, err
	}

	followers, err := s.repo.FollowersCount(ctx, userID)
	if err != nil {
		return identitydomain.User{}, 0, 0, 0, fmt.Errorf("count followers: %w", err)
	}
	following, err := s.repo.FollowingCount(ctx, userID)
	if err != nil {
		return identitydomain.User{}, 0, 0, 0, fmt.Errorf("count following: %w", err)
	}

	var recipes int64
	if s.recipe != nil {
		recipes, err = s.recipe.AuthorRecipeCount(ctx, userID)
		if err != nil {
			return identitydomain.User{}, 0, 0, 0, fmt.Errorf("count recipes: %w", err)
		}
	}

	return user, followers, following, recipes, nil
}

// PatchMe updates current user profile fields.
func (s *Service) PatchMe(ctx context.Context, userID uint64, input PatchProfileInput) (identitydomain.User, error) {
	user, err := s.repo.UserByID(ctx, userID)
	if err != nil {
		return identitydomain.User{}, err
	}

	if input.DisplayName != nil {
		displayName := strings.TrimSpace(*input.DisplayName)
		if displayName == "" || len(displayName) > displayNameMaxLen {
			return identitydomain.User{}, ErrInvalidInput
		}
		user.DisplayName = displayName
	}
	if input.Bio != nil {
		user.Bio = input.Bio
	}
	if input.AvatarURL != nil {
		user.AvatarURL = input.AvatarURL
	}

	return s.repo.UpdateUser(ctx, user)
}

// UserExists reports whether a user id exists.
func (s *Service) UserExists(ctx context.Context, userID uint64) (bool, error) {
	_, err := s.repo.UserByID(ctx, userID)
	if err == nil {
		return true, nil
	}
	if errors.Is(err, ErrNotFound) {
		return false, nil
	}

	return false, err
}

// UserShort returns a safe user preview.
func (s *Service) UserShort(ctx context.Context, userID uint64) (identitydomain.UserShort, error) {
	user, err := s.repo.UserByID(ctx, userID)
	if err != nil {
		return identitydomain.UserShort{}, err
	}

	return toUserShort(user), nil
}

// UsersBatch returns safe previews for requested ids.
func (s *Service) UsersBatch(ctx context.Context, ids []uint64) ([]identitydomain.UserShort, error) {
	users, err := s.repo.UsersByIDs(ctx, ids)
	if err != nil {
		return nil, err
	}

	out := make([]identitydomain.UserShort, 0, len(users))
	for _, user := range users {
		out = append(out, toUserShort(user))
	}

	return out, nil
}

// ListFollowers returns followers with user previews.
func (s *Service) ListFollowers(ctx context.Context, userID uint64, limit, offset int) (identitydomain.Page[identitydomain.FollowUser], error) {
	if ok, err := s.UserExists(ctx, userID); err != nil || !ok {
		return identitydomain.Page[identitydomain.FollowUser]{}, notFoundOrWrapped(err)
	}

	return s.repo.ListFollowers(ctx, userID, limit, offset)
}

// ListFollowing returns followed users with previews.
func (s *Service) ListFollowing(ctx context.Context, userID uint64, limit, offset int) (identitydomain.Page[identitydomain.FollowUser], error) {
	if ok, err := s.UserExists(ctx, userID); err != nil || !ok {
		return identitydomain.Page[identitydomain.FollowUser]{}, notFoundOrWrapped(err)
	}

	return s.repo.ListFollowing(ctx, userID, limit, offset)
}

// Follow creates a follow relation.
func (s *Service) Follow(ctx context.Context, followerID, followingID uint64) error {
	if followerID == followingID {
		return ErrSelfFollow
	}
	if ok, err := s.UserExists(ctx, followingID); err != nil || !ok {
		return notFoundOrWrapped(err)
	}

	exists, err := s.repo.FollowExists(ctx, followerID, followingID)
	if err != nil {
		return fmt.Errorf("check follow: %w", err)
	}
	if exists {
		return ErrAlreadyFollowing
	}

	return s.repo.CreateFollow(ctx, identitydomain.Follow{
		FollowerID:  followerID,
		FollowingID: followingID,
		CreatedAt:   time.Now().UTC(),
	})
}

// Unfollow removes a follow relation.
func (s *Service) Unfollow(ctx context.Context, followerID, followingID uint64) error {
	if ok, err := s.UserExists(ctx, followingID); err != nil || !ok {
		return notFoundOrWrapped(err)
	}

	return s.repo.DeleteFollow(ctx, followerID, followingID)
}

func (s *Service) ensureUniqueUser(ctx context.Context, email, username string) error {
	emailExists, err := s.repo.EmailExists(ctx, email)
	if err != nil {
		return fmt.Errorf("check email: %w", err)
	}
	if emailExists {
		return ErrEmailExists
	}

	usernameExists, err := s.repo.UsernameExists(ctx, username)
	if err != nil {
		return fmt.Errorf("check username: %w", err)
	}
	if usernameExists {
		return ErrUsernameExists
	}

	return nil
}

func (s *Service) issueTokenPair(ctx context.Context, userID uint64) (TokenPair, error) {
	access, err := s.tokens.IssueAccessToken(userID, time.Duration(s.cfg.AccessTTLSeconds)*time.Second)
	if err != nil {
		return TokenPair{}, fmt.Errorf("issue access token: %w", err)
	}

	rawRefresh, err := s.tokens.RandomRefreshToken()
	if err != nil {
		return TokenPair{}, fmt.Errorf("generate refresh token: %w", err)
	}

	err = s.repo.CreateRefreshToken(ctx, identitydomain.RefreshToken{
		UserID:    userID,
		TokenHash: s.tokens.HashRefreshToken(rawRefresh),
		ExpiresAt: time.Now().UTC().Add(time.Duration(s.cfg.RefreshTTLSeconds) * time.Second),
	})
	if err != nil {
		return TokenPair{}, fmt.Errorf("store refresh token: %w", err)
	}

	return TokenPair{
		AccessToken:  access,
		RefreshToken: rawRefresh,
		ExpiresIn:    s.cfg.AccessTTLSeconds,
	}, nil
}

func normalizeRegister(input RegisterInput) (RegisterInput, error) {
	input.Email = strings.TrimSpace(strings.ToLower(input.Email))
	input.Username = strings.TrimSpace(input.Username)
	input.DisplayName = strings.TrimSpace(input.DisplayName)

	addr, err := mail.ParseAddress(input.Email)
	if input.Email == "" || err != nil || strings.TrimSpace(addr.Name) != "" || !strings.EqualFold(strings.TrimSpace(addr.Address), input.Email) {
		return RegisterInput{}, ErrInvalidInput
	}
	if len(input.Username) < usernameMinLen || len(input.Username) > usernameMaxLen {
		return RegisterInput{}, ErrInvalidInput
	}
	if len(input.Password) < passwordMinLen {
		return RegisterInput{}, ErrInvalidInput
	}
	if input.DisplayName == "" || len(input.DisplayName) > displayNameMaxLen {
		return RegisterInput{}, ErrInvalidInput
	}

	return input, nil
}

func toUserShort(user identitydomain.User) identitydomain.UserShort {
	return identitydomain.UserShort{
		ID:          user.ID,
		Username:    user.Username,
		DisplayName: user.DisplayName,
		AvatarURL:   user.AvatarURL,
	}
}

func notFoundOrWrapped(err error) error {
	if err == nil {
		return ErrNotFound
	}

	return err
}
