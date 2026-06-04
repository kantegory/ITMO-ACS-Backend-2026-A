// Package identityrepo adapts identity use cases to a GORM database.
package identityrepo

import (
	"context"
	"errors"
	"strings"
	"time"

	identitydomain "recipehub/internal/domain/identity"
	identityusecase "recipehub/internal/usecase/identity"

	"gorm.io/gorm"
)

const (
	usersTable         = "users"
	refreshTokensTable = "refresh_tokens"
	followsTable       = "follows"
)

var _ identityusecase.Repository = (*Repository)(nil)

// Repository stores identity data in PostgreSQL via GORM.
type Repository struct {
	db *gorm.DB
}

// New creates an identity repository adapter.
func New(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

// UserByID returns a user by id.
func (r *Repository) UserByID(ctx context.Context, id uint64) (identitydomain.User, error) {
	var row userRow
	if err := r.db.WithContext(ctx).First(&row, id).Error; err != nil {
		return identitydomain.User{}, mapNotFound(err)
	}

	return toDomainUser(row), nil
}

// UserByEmail returns a user by email.
func (r *Repository) UserByEmail(ctx context.Context, email string) (identitydomain.User, error) {
	var row userRow
	err := r.db.WithContext(ctx).
		Where("LOWER(email) = ?", strings.ToLower(strings.TrimSpace(email))).
		First(&row).
		Error
	if err != nil {
		return identitydomain.User{}, mapNotFound(err)
	}

	return toDomainUser(row), nil
}

// UsersByIDs returns users for ids in the requested order.
func (r *Repository) UsersByIDs(ctx context.Context, ids []uint64) ([]identitydomain.User, error) {
	if len(ids) == 0 {
		return nil, nil
	}

	var rows []userRow
	if err := r.db.WithContext(ctx).Where("id IN ?", ids).Find(&rows).Error; err != nil {
		return nil, err
	}

	byID := make(map[uint64]userRow, len(rows))
	for _, row := range rows {
		byID[row.ID] = row
	}

	out := make([]identitydomain.User, 0, len(ids))
	for _, id := range ids {
		row, ok := byID[id]
		if !ok {
			continue
		}
		out = append(out, toDomainUser(row))
	}

	return out, nil
}

// CreateUser creates a user.
func (r *Repository) CreateUser(ctx context.Context, user identitydomain.User) (identitydomain.User, error) {
	row := userRow{
		Email:        user.Email,
		Username:     user.Username,
		PasswordHash: user.PasswordHash,
		DisplayName:  user.DisplayName,
		Bio:          user.Bio,
		AvatarURL:    user.AvatarURL,
	}
	if err := r.db.WithContext(ctx).Create(&row).Error; err != nil {
		return identitydomain.User{}, err
	}

	return toDomainUser(row), nil
}

// UpdateUser updates profile fields.
func (r *Repository) UpdateUser(ctx context.Context, user identitydomain.User) (identitydomain.User, error) {
	row := toUserRow(user)
	if err := r.db.WithContext(ctx).Save(&row).Error; err != nil {
		return identitydomain.User{}, err
	}

	return toDomainUser(row), nil
}

// EmailExists checks email uniqueness.
func (r *Repository) EmailExists(ctx context.Context, email string) (bool, error) {
	return r.existsBy(ctx, "LOWER(email) = ?", strings.ToLower(strings.TrimSpace(email)))
}

// UsernameExists checks username uniqueness.
func (r *Repository) UsernameExists(ctx context.Context, username string) (bool, error) {
	return r.existsBy(ctx, "username = ?", strings.TrimSpace(username))
}

// CreateRefreshToken stores a hashed refresh token.
func (r *Repository) CreateRefreshToken(ctx context.Context, token identitydomain.RefreshToken) error {
	row := refreshTokenRow{
		UserID:    token.UserID,
		TokenHash: token.TokenHash,
		ExpiresAt: token.ExpiresAt,
	}

	return r.db.WithContext(ctx).Create(&row).Error
}

// RefreshTokenByHash returns a refresh token by hash.
func (r *Repository) RefreshTokenByHash(ctx context.Context, hash string) (identitydomain.RefreshToken, error) {
	var row refreshTokenRow
	if err := r.db.WithContext(ctx).Where("token_hash = ?", hash).First(&row).Error; err != nil {
		return identitydomain.RefreshToken{}, mapNotFound(err)
	}

	return identitydomain.RefreshToken{
		ID:        row.ID,
		UserID:    row.UserID,
		TokenHash: row.TokenHash,
		ExpiresAt: row.ExpiresAt,
	}, nil
}

// DeleteRefreshTokenByHash deletes a refresh token by hash.
func (r *Repository) DeleteRefreshTokenByHash(ctx context.Context, hash string) error {
	return r.db.WithContext(ctx).Where("token_hash = ?", hash).Delete(&refreshTokenRow{}).Error
}

// FollowersCount returns follower count for a user.
func (r *Repository) FollowersCount(ctx context.Context, userID uint64) (int64, error) {
	return r.countFollows(ctx, "following_id = ?", userID)
}

// FollowingCount returns following count for a user.
func (r *Repository) FollowingCount(ctx context.Context, userID uint64) (int64, error) {
	return r.countFollows(ctx, "follower_id = ?", userID)
}

// ListFollowers returns users following a user.
func (r *Repository) ListFollowers(ctx context.Context, userID uint64, limit, offset int) (identitydomain.Page[identitydomain.FollowUser], error) {
	return r.listFollowUsers(ctx, `
		SELECT users.id, users.email, users.username, users.password_hash, users.display_name, users.bio, users.avatar_url, users.created_at, users.updated_at, follows.created_at AS follow_created_at
		FROM follows
		JOIN users ON users.id = follows.follower_id
		WHERE follows.following_id = ?
		ORDER BY follows.created_at DESC
		LIMIT ? OFFSET ?`, "following_id = ?", userID, limit, offset)
}

// ListFollowing returns users followed by a user.
func (r *Repository) ListFollowing(ctx context.Context, userID uint64, limit, offset int) (identitydomain.Page[identitydomain.FollowUser], error) {
	return r.listFollowUsers(ctx, `
		SELECT users.id, users.email, users.username, users.password_hash, users.display_name, users.bio, users.avatar_url, users.created_at, users.updated_at, follows.created_at AS follow_created_at
		FROM follows
		JOIN users ON users.id = follows.following_id
		WHERE follows.follower_id = ?
		ORDER BY follows.created_at DESC
		LIMIT ? OFFSET ?`, "follower_id = ?", userID, limit, offset)
}

// FollowExists checks whether follower already follows following.
func (r *Repository) FollowExists(ctx context.Context, followerID, followingID uint64) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&followRow{}).
		Where("follower_id = ? AND following_id = ?", followerID, followingID).
		Count(&count).
		Error
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

// CreateFollow creates a follow relation.
func (r *Repository) CreateFollow(ctx context.Context, follow identitydomain.Follow) error {
	row := followRow{
		FollowerID:  follow.FollowerID,
		FollowingID: follow.FollowingID,
		CreatedAt:   follow.CreatedAt,
	}

	return r.db.WithContext(ctx).Create(&row).Error
}

// DeleteFollow deletes a follow relation.
func (r *Repository) DeleteFollow(ctx context.Context, followerID, followingID uint64) error {
	return r.db.WithContext(ctx).
		Where("follower_id = ? AND following_id = ?", followerID, followingID).
		Delete(&followRow{}).
		Error
}

func (r *Repository) existsBy(ctx context.Context, query string, args ...any) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&userRow{}).Where(query, args...).Count(&count).Error
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func (r *Repository) countFollows(ctx context.Context, query string, userID uint64) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&followRow{}).Where(query, userID).Count(&count).Error
	if err != nil {
		return 0, err
	}

	return count, nil
}

func (r *Repository) listFollowUsers(ctx context.Context, sql, countQuery string, userID uint64, limit, offset int) (identitydomain.Page[identitydomain.FollowUser], error) {
	var total int64
	if err := r.db.WithContext(ctx).Model(&followRow{}).Where(countQuery, userID).Count(&total).Error; err != nil {
		return identitydomain.Page[identitydomain.FollowUser]{}, err
	}

	var rows []struct {
		ID              uint64
		Email           string
		Username        string
		PasswordHash    string
		DisplayName     string
		Bio             *string
		AvatarURL       *string
		CreatedAt       time.Time
		UpdatedAt       time.Time
		FollowCreatedAt time.Time
	}
	if err := r.db.WithContext(ctx).Raw(sql, userID, limit, offset).Scan(&rows).Error; err != nil {
		return identitydomain.Page[identitydomain.FollowUser]{}, err
	}

	items := make([]identitydomain.FollowUser, 0, len(rows))
	for _, row := range rows {
		items = append(items, identitydomain.FollowUser{
			User: identitydomain.UserShort{
				ID:          row.ID,
				Username:    row.Username,
				DisplayName: row.DisplayName,
				AvatarURL:   row.AvatarURL,
			},
			CreatedAt: row.FollowCreatedAt,
		})
	}

	return identitydomain.Page[identitydomain.FollowUser]{Items: items, Total: total}, nil
}

func mapNotFound(err error) error {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return identityusecase.ErrNotFound
	}

	return err
}

func toDomainUser(row userRow) identitydomain.User {
	return identitydomain.User{
		ID:           row.ID,
		Email:        row.Email,
		Username:     row.Username,
		PasswordHash: row.PasswordHash,
		DisplayName:  row.DisplayName,
		Bio:          row.Bio,
		AvatarURL:    row.AvatarURL,
		CreatedAt:    row.CreatedAt,
		UpdatedAt:    row.UpdatedAt,
	}
}

func toUserRow(user identitydomain.User) userRow {
	return userRow{
		ID:           user.ID,
		Email:        user.Email,
		Username:     user.Username,
		PasswordHash: user.PasswordHash,
		DisplayName:  user.DisplayName,
		Bio:          user.Bio,
		AvatarURL:    user.AvatarURL,
		CreatedAt:    user.CreatedAt,
		UpdatedAt:    user.UpdatedAt,
	}
}
