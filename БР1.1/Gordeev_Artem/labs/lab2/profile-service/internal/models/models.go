package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Company struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Name        string    `gorm:"not null"`
	Description string
	Website     string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type JobSeeker struct {
	UserID    uuid.UUID `gorm:"type:uuid;primaryKey"`
	FirstName string    `gorm:"not null"`
	LastName  string    `gorm:"not null"`
	Phone     string
}

type Employer struct {
	UserID    uuid.UUID  `gorm:"type:uuid;primaryKey"`
	CompanyID *uuid.UUID `gorm:"type:uuid;index"`
	FirstName string     `gorm:"not null"`
	LastName  string     `gorm:"not null"`
	Position  string
}

func (m *Company) BeforeCreate(tx *gorm.DB) (err error) {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return
}
