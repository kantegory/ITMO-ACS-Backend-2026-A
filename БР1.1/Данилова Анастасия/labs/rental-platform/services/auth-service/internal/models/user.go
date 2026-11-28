package models

import (
	"time"

	"rental-platform/shared/jwt"
)

type User struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	Role       jwt.Role  `gorm:"type:varchar(20);not null" json:"role"`
	FirstName  string    `json:"first_name"`
	LastName   string    `json:"last_name"`
	Email      string    `gorm:"uniqueIndex;not null" json:"email"`
	Password   string    `gorm:"not null" json:"-"`
	IsVerified bool      `gorm:"not null;default:false" json:"is_verified"`
	IsActive   bool      `gorm:"not null;default:true" json:"is_active"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type RefreshToken struct {
	ID        uint       `gorm:"primaryKey"`
	UserID    uint       `gorm:"not null;index"`
	TokenHash string     `gorm:"not null;uniqueIndex"`
	ExpiresAt time.Time  `gorm:"not null"`
	RevokedAt *time.Time `gorm:"index"`
	CreatedAt time.Time
}
