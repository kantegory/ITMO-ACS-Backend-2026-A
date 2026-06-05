// Package identity contains user and social graph domain types.
package identity

import "time"

// User describes an account profile owned by identity-service.
type User struct {
	ID           uint64
	Email        string
	Username     string
	PasswordHash string
	DisplayName  string
	Bio          *string
	AvatarURL    *string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

// UserShort is a safe user preview for other services.
type UserShort struct {
	ID          uint64
	Username    string
	DisplayName string
	AvatarURL   *string
}

// RefreshToken stores a hashed refresh token.
type RefreshToken struct {
	ID        uint64
	UserID    uint64
	TokenHash string
	ExpiresAt time.Time
}

// Follow joins follower and followed users.
type Follow struct {
	FollowerID  uint64
	FollowingID uint64
	CreatedAt   time.Time
}

// FollowUser contains a listed follow relation and the user on the other side.
type FollowUser struct {
	User      UserShort
	CreatedAt time.Time
}

// Page describes paginated identity results.
type Page[T any] struct {
	Items []T
	Total int64
}
