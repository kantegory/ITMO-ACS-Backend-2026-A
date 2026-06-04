package identity

import (
	"context"
	"testing"

	identitydomain "recipehub/internal/domain/identity"
)

func TestUserProfileIncludesRecipeCount(t *testing.T) {
	repo := &profileRepository{
		user:           identitydomain.User{ID: 42, Email: "a@example.com", Username: "alina", DisplayName: "Alina"},
		followersCount: 3,
		followingCount: 5,
	}
	recipe := &profileRecipeGateway{count: 8}
	service := NewService(repo, nil, Config{}, recipe)

	user, followers, following, recipes, err := service.UserProfile(context.Background(), 42)
	if err != nil {
		t.Fatalf("UserProfile returned error: %v", err)
	}

	if user.ID != 42 {
		t.Fatalf("user ID = %d, want 42", user.ID)
	}
	if followers != 3 || following != 5 || recipes != 8 {
		t.Fatalf("counts = followers:%d following:%d recipes:%d, want 3/5/8", followers, following, recipes)
	}
}

type profileRepository struct {
	user           identitydomain.User
	followersCount int64
	followingCount int64
}

func (r *profileRepository) UserByID(context.Context, uint64) (identitydomain.User, error) {
	return r.user, nil
}

func (r *profileRepository) UserByEmail(context.Context, string) (identitydomain.User, error) {
	return identitydomain.User{}, nil
}

func (r *profileRepository) UsersByIDs(context.Context, []uint64) ([]identitydomain.User, error) {
	return nil, nil
}

func (r *profileRepository) CreateUser(_ context.Context, user identitydomain.User) (identitydomain.User, error) {
	return user, nil
}

func (r *profileRepository) UpdateUser(_ context.Context, user identitydomain.User) (identitydomain.User, error) {
	return user, nil
}

func (r *profileRepository) EmailExists(context.Context, string) (bool, error) {
	return false, nil
}

func (r *profileRepository) UsernameExists(context.Context, string) (bool, error) {
	return false, nil
}

func (r *profileRepository) CreateRefreshToken(context.Context, identitydomain.RefreshToken) error {
	return nil
}

func (r *profileRepository) RefreshTokenByHash(context.Context, string) (identitydomain.RefreshToken, error) {
	return identitydomain.RefreshToken{}, nil
}

func (r *profileRepository) DeleteRefreshTokenByHash(context.Context, string) error {
	return nil
}

func (r *profileRepository) FollowersCount(context.Context, uint64) (int64, error) {
	return r.followersCount, nil
}

func (r *profileRepository) FollowingCount(context.Context, uint64) (int64, error) {
	return r.followingCount, nil
}

func (r *profileRepository) ListFollowers(context.Context, uint64, int, int) (identitydomain.Page[identitydomain.FollowUser], error) {
	return identitydomain.Page[identitydomain.FollowUser]{}, nil
}

func (r *profileRepository) ListFollowing(context.Context, uint64, int, int) (identitydomain.Page[identitydomain.FollowUser], error) {
	return identitydomain.Page[identitydomain.FollowUser]{}, nil
}

func (r *profileRepository) FollowExists(context.Context, uint64, uint64) (bool, error) {
	return false, nil
}

func (r *profileRepository) CreateFollow(context.Context, identitydomain.Follow) error {
	return nil
}

func (r *profileRepository) DeleteFollow(context.Context, uint64, uint64) error {
	return nil
}

type profileRecipeGateway struct {
	count int64
}

func (g *profileRecipeGateway) AuthorRecipeCount(context.Context, uint64) (int64, error) {
	return g.count, nil
}
