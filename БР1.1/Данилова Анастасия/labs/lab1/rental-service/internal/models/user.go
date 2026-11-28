package models

import "time"

type User struct {
	ID         uint   `gorm:"primaryKey"`
	Role       Role   `gorm:"type:varchar(20);not null"`
	FirstName  string `json:"first_name"`
	LastName   string `json:"last_name"`
	Email      string `gorm:"unique; not null" json:"email"`
	Password   string `gorm:"not null" json:"-"`
	IsVerified bool   `gorm:"not null" json:"is_verified"`
	IsActive   bool   `json:"is_active"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Role string

const (
	RoleTenant   Role = "TENANT"
	RoleLandlord Role = "LANDLORD"
	RoleBoth     Role = "BOTH"
)

func (r Role) IsValid() bool {
	switch r {
	case RoleTenant, RoleLandlord, RoleBoth:
		return true
	}
	return false
}
