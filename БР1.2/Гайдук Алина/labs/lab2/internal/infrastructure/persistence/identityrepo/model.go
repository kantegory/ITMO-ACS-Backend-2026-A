package identityrepo

import "time"

type userRow struct {
	ID           uint64 `gorm:"primaryKey"`
	Email        string `gorm:"uniqueIndex;not null;size:255"`
	Username     string `gorm:"uniqueIndex;not null;size:100"`
	PasswordHash string `gorm:"not null;size:255"`
	DisplayName  string `gorm:"not null;size:100"`
	Bio          *string
	AvatarURL    *string `gorm:"size:512"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

func (userRow) TableName() string {
	return usersTable
}

type refreshTokenRow struct {
	ID        uint64 `gorm:"primaryKey"`
	UserID    uint64 `gorm:"index;not null"`
	TokenHash string `gorm:"uniqueIndex;not null;size:64"`
	ExpiresAt time.Time
}

func (refreshTokenRow) TableName() string {
	return refreshTokensTable
}

type followRow struct {
	FollowerID  uint64 `gorm:"primaryKey"`
	FollowingID uint64 `gorm:"primaryKey"`
	CreatedAt   time.Time
}

func (followRow) TableName() string {
	return followsTable
}
