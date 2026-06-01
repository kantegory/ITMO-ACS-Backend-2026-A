package model

import (
	"time"

	"github.com/google/uuid"
)

type UserRole string

const (
	RoleCandidate UserRole = "candidate"
	RoleEmployer  UserRole = "employer"
)

type VacancyStatus string

const (
	VacancyDraft    VacancyStatus = "draft"
	VacancyActive   VacancyStatus = "active"
	VacancyClosed   VacancyStatus = "closed"
	VacancyArchived VacancyStatus = "archived"
)

type ApplicationStatus string

const (
	AppPending  ApplicationStatus = "pending"
	AppAccepted ApplicationStatus = "accepted"
	AppRejected ApplicationStatus = "rejected"
)

type WorkFormat string

const (
	FormatRemote WorkFormat = "remote"
	FormatOffice WorkFormat = "office"
	FormatHybrid WorkFormat = "hybrid"
)

type ExperienceLevel string

const (
	ExpNone        ExperienceLevel = "no_experience"
	ExpOneToThree  ExperienceLevel = "one_to_three"
	ExpThreeToSix  ExperienceLevel = "three_to_six"
	ExpSixPlus     ExperienceLevel = "six_plus"
)

type User struct {
	ID           uuid.UUID `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Role         UserRole  `json:"role"`
	CreatedAt    time.Time `json:"created_at"`
}

type Industry struct {
	ID   uuid.UUID `json:"id"`
	Name string    `json:"name"`
}

type Currency struct {
	Code   string `json:"code"`
	Name   string `json:"name"`
	Symbol string `json:"symbol"`
}

type Skill struct {
	ID   uuid.UUID `json:"id"`
	Name string    `json:"name"`
}

type Company struct {
	ID          uuid.UUID  `json:"id"`
	UserID      uuid.UUID  `json:"user_id"`
	Name        string     `json:"name"`
	Description *string    `json:"description,omitempty"`
	Location    *string    `json:"location,omitempty"`
	Industry    *Industry  `json:"industry,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

type Resume struct {
	ID        uuid.UUID  `json:"id"`
	UserID    uuid.UUID  `json:"user_id"`
	FullName  *string    `json:"full_name,omitempty"`
	Title     *string    `json:"title,omitempty"`
	Bio       *string    `json:"bio,omitempty"`
	Skills    []Skill    `json:"skills"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

type Vacancy struct {
	ID              uuid.UUID        `json:"id"`
	CompanyID       uuid.UUID        `json:"-"`
	IndustryID      *uuid.UUID       `json:"-"`
	CurrencyCode    string           `json:"currency_code"`
	Title           string           `json:"title"`
	Description     *string          `json:"description,omitempty"`
	SalaryMin       *int             `json:"salary_min,omitempty"`
	SalaryMax       *int             `json:"salary_max,omitempty"`
	ExperienceLevel *ExperienceLevel `json:"experience_level,omitempty"`
	Format          WorkFormat       `json:"format"`
	Status          VacancyStatus    `json:"status"`
	CreatedAt       time.Time        `json:"created_at"`
	UpdatedAt       time.Time        `json:"updated_at"`
	Company         *Company         `json:"company,omitempty"`
	Industry        *Industry        `json:"industry,omitempty"`
	Skills          []Skill          `json:"skills,omitempty"`
}

type Application struct {
	ID          uuid.UUID         `json:"id"`
	VacancyID   uuid.UUID         `json:"vacancy_id"`
	CandidateID uuid.UUID         `json:"candidate_id"`
	ResumeID    uuid.UUID         `json:"resume_id"`
	CoverLetter *string           `json:"cover_letter,omitempty"`
	Status      ApplicationStatus `json:"status"`
	AppliedAt   time.Time         `json:"applied_at"`
	Vacancy     *Vacancy          `json:"vacancy,omitempty"`
	Resume      *Resume           `json:"resume,omitempty"`
	Candidate   *User             `json:"candidate,omitempty"`
}

type PaginationMeta struct {
	Total      int `json:"total"`
	Page       int `json:"page"`
	PerPage    int `json:"per_page"`
	TotalPages int `json:"total_pages"`
}
