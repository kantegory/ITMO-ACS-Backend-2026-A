package models

import "time"

type User struct {
	ID           uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Email        string    `gorm:"type:varchar(150);unique;not null" json:"email"`
	PasswordHash string    `gorm:"type:varchar(255);not null" json:"-"`
	FullName     string    `gorm:"type:varchar(100);not null" json:"full_name"`
	Phone        *string   `gorm:"type:varchar(20)" json:"phone,omitempty"`
	Role         string    `gorm:"type:varchar(20);default:'tenant';check:role IN ('tenant', 'owner', 'admin')" json:"role"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"created_at"`
}

func (User) TableName() string { return "users" }