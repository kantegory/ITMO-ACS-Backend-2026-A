package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ExperienceLevel string

const (
	ExpNoExperience ExperienceLevel = "no_experience"
	Exp1To3         ExperienceLevel = "between_1_and_3"
	Exp3To6         ExperienceLevel = "between_3_and_6"
	ExpMoreThan6    ExperienceLevel = "more_than_6"
)

type JobStatus string

const (
	JobDraft    JobStatus = "draft"
	JobActive   JobStatus = "active"
	JobClosed   JobStatus = "closed"
	JobArchived JobStatus = "archived"
)

type ApplicationStatus string

const (
	AppSent      ApplicationStatus = "sent"
	AppViewed    ApplicationStatus = "viewed"
	AppRejected  ApplicationStatus = "rejected"
	AppInterview ApplicationStatus = "interview"
	AppHired     ApplicationStatus = "hired"
)

type Industry struct {
	ID   uint   `gorm:"primaryKey;autoIncrement"`
	Name string `gorm:"not null;uniqueIndex"`
}

type Job struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	EmployerID   uuid.UUID `gorm:"type:uuid;not null"`
	CompanyID    uuid.UUID `gorm:"type:uuid;not null;index"`
	IndustryID   uint      `gorm:"not null;index"`
	Title        string    `gorm:"not null"`
	Description  string    `gorm:"not null"`
	Requirements string    `gorm:"not null"`
	SalaryMin    float64
	SalaryMax    float64
	Currency     string          `gorm:"default:'RUB'"`
	Experience   ExperienceLevel `gorm:"not null"`
	Status       JobStatus       `gorm:"not null;default:'active'"`
	CreatedAt    time.Time
	UpdatedAt    time.Time

	Industry     *Industry        `gorm:"foreignKey:IndustryID"`
	Applications []JobApplication `gorm:"foreignKey:JobID;constraint:OnDelete:CASCADE"`
}

type JobApplication struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	JobID       uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_job_jobseeker"`
	JobSeekerID uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_job_jobseeker"`
	ResumeID    uuid.UUID `gorm:"type:uuid;not null"`
	CoverLetter string
	Status      ApplicationStatus `gorm:"not null;default:'sent'"`
	CreatedAt   time.Time
	UpdatedAt   time.Time

	Job *Job `gorm:"foreignKey:JobID"`
}

func (m *Job) BeforeCreate(tx *gorm.DB) (err error) {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return
}

func (m *JobApplication) BeforeCreate(tx *gorm.DB) (err error) {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return
}
