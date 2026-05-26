package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Resume struct {
	ID                uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	JobSeekerID       uuid.UUID `gorm:"type:uuid;not null;index"`
	Title             string    `gorm:"not null"`
	Summary           string
	SalaryExpectation float64
	IsActive          bool `gorm:"default:true"`
	CreatedAt         time.Time
	UpdatedAt         time.Time

	Skills      []Skill      `gorm:"foreignKey:ResumeID;constraint:OnDelete:CASCADE"`
	Educations  []Education  `gorm:"foreignKey:ResumeID;constraint:OnDelete:CASCADE"`
	Experiences []Experience `gorm:"foreignKey:ResumeID;constraint:OnDelete:CASCADE"`
}

type Skill struct {
	ID       uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	ResumeID uuid.UUID `gorm:"type:uuid;not null;index"`
	Name     string    `gorm:"not null"`
}

type Education struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	ResumeID    uuid.UUID `gorm:"type:uuid;not null;index"`
	Institution string    `gorm:"not null"`
	Degree      string    `gorm:"not null"`
	StartDate   time.Time
	EndDate     *time.Time
}

type Experience struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	ResumeID    uuid.UUID `gorm:"type:uuid;not null;index"`
	CompanyName string    `gorm:"not null"`
	Position    string    `gorm:"not null"`
	Description string
	StartDate   time.Time
	EndDate     *time.Time
}

func (m *Resume) BeforeCreate(tx *gorm.DB) (err error) {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return
}

func (m *Skill) BeforeCreate(tx *gorm.DB) (err error) {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return
}

func (m *Education) BeforeCreate(tx *gorm.DB) (err error) {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return
}

func (m *Experience) BeforeCreate(tx *gorm.DB) (err error) {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return
}
