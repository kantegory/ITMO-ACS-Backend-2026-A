package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRole string

const (
	RoleJobSeeker UserRole = "job_seeker"
	RoleEmployer  UserRole = "employer"
	RoleAdmin     UserRole = "admin"
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

// Base model for UUID-based entities
type Base struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

type User struct {
	Base
	Email        string   `gorm:"uniqueIndex;not null"`
	PasswordHash string   `gorm:"not null"`
	Role         UserRole `gorm:"not null"`
	
	JobSeeker *JobSeeker `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	Employer  *Employer  `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
}

type Company struct {
	Base
	Name        string `gorm:"not null"`
	Description string
	Website     string
	
	Employers []Employer `gorm:"foreignKey:CompanyID;constraint:OnDelete:SET NULL"`
	Jobs      []Job      `gorm:"foreignKey:CompanyID;constraint:OnDelete:CASCADE"`
}

type Employer struct {
	UserID    uuid.UUID `gorm:"type:uuid;primaryKey"`
	CompanyID *uuid.UUID `gorm:"type:uuid;index"`
	FirstName string    `gorm:"not null"`
	LastName  string    `gorm:"not null"`
	Position  string
	
	Company *Company `gorm:"foreignKey:CompanyID"`
	User    *User    `gorm:"foreignKey:UserID"`
	Jobs    []Job    `gorm:"foreignKey:EmployerID;constraint:OnDelete:CASCADE"`
}

type JobSeeker struct {
	UserID    uuid.UUID `gorm:"type:uuid;primaryKey"`
	FirstName string    `gorm:"not null"`
	LastName  string    `gorm:"not null"`
	Phone     string
	
	User         *User            `gorm:"foreignKey:UserID"`
	Resumes      []Resume         `gorm:"foreignKey:JobSeekerID;constraint:OnDelete:CASCADE"`
	Applications []JobApplication `gorm:"foreignKey:JobSeekerID;constraint:OnDelete:CASCADE"`
}

type Resume struct {
	Base
	JobSeekerID       uuid.UUID `gorm:"type:uuid;not null;index"`
	Title             string    `gorm:"not null"`
	Summary           string
	SalaryExpectation float64
	IsActive          bool `gorm:"default:true"`
	
	JobSeeker    *JobSeeker       `gorm:"foreignKey:JobSeekerID"`
	Skills       []Skill          `gorm:"foreignKey:ResumeID;constraint:OnDelete:CASCADE"`
	Educations   []Education      `gorm:"foreignKey:ResumeID;constraint:OnDelete:CASCADE"`
	Experiences  []Experience     `gorm:"foreignKey:ResumeID;constraint:OnDelete:CASCADE"`
	Applications []JobApplication `gorm:"foreignKey:ResumeID;constraint:OnDelete:CASCADE"`
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

type Industry struct {
	ID   uint   `gorm:"primaryKey;autoIncrement"`
	Name string `gorm:"not null;uniqueIndex"`
	Jobs []Job  `gorm:"foreignKey:IndustryID"`
}

type Job struct {
	Base
	EmployerID   uuid.UUID       `gorm:"type:uuid;not null"`
	CompanyID    uuid.UUID       `gorm:"type:uuid;not null;index"`
	IndustryID   uint            `gorm:"not null;index"`
	Title        string          `gorm:"not null"`
	Description  string          `gorm:"not null"`
	Requirements string          `gorm:"not null"`
	SalaryMin    float64
	SalaryMax    float64
	Currency     string          `gorm:"default:'RUB'"`
	Experience   ExperienceLevel `gorm:"not null"`
	Status       JobStatus       `gorm:"not null;default:'active'"`

	Employer     *Employer        `gorm:"foreignKey:EmployerID"`
	Company      *Company         `gorm:"foreignKey:CompanyID"`
	Industry     *Industry        `gorm:"foreignKey:IndustryID"`
	Applications []JobApplication `gorm:"foreignKey:JobID;constraint:OnDelete:CASCADE"`
}

type JobApplication struct {
	Base
	JobID       uuid.UUID         `gorm:"type:uuid;not null;uniqueIndex:idx_job_jobseeker"`
	JobSeekerID uuid.UUID         `gorm:"type:uuid;not null;uniqueIndex:idx_job_jobseeker"`
	ResumeID    uuid.UUID         `gorm:"type:uuid;not null"`
	CoverLetter string
	Status      ApplicationStatus `gorm:"not null;default:'sent'"`

	Job       *Job       `gorm:"foreignKey:JobID"`
	JobSeeker *JobSeeker `gorm:"foreignKey:JobSeekerID"`
	Resume    *Resume    `gorm:"foreignKey:ResumeID"`
}

// BeforeCreate hooks for UUIDs in models that don't embed Base
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

func (m *Base) BeforeCreate(tx *gorm.DB) (err error) {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return
}
