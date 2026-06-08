package domain

import (
	"time"

	"github.com/google/uuid"
)

type Industry struct {
	ID   uuid.UUID `json:"id"`
	Name string    `json:"name"`
	Slug string    `json:"slug"`
}

type ExperienceLevel struct {
	ID       uuid.UUID `json:"id"`
	Name     string    `json:"name"`
	Slug     string    `json:"slug"`
	MinYears int       `json:"min_years"`
	MaxYears *int      `json:"max_years"`
}

type Vacancy struct {
	ID                uuid.UUID
	EmployerUserID    uuid.UUID
	IndustryID        uuid.UUID
	ExperienceLevelID uuid.UUID
	Title             string
	Description       string
	Requirements      string
	SalaryFrom        *int
	SalaryTo          *int
	SalaryCurrency    string
	Location          string
	CompanyName       string
	IsPublished       bool
	CreatedAt         time.Time
	UpdatedAt         time.Time
}

type VacancyListItem struct {
	Vacancy
	Industry        Industry
	ExperienceLevel ExperienceLevel
}

type EmployerInfo struct {
	UserID      uuid.UUID
	CompanyName string
}

type VacancyDetail struct {
	VacancyListItem
	Employer EmployerInfo
}

type VacancyFilter struct {
	IndustryID        *uuid.UUID
	ExperienceLevelID *uuid.UUID
	SalaryMin         *int
	Query             string
	OnlyPublished     bool
	EmployerUserID    *uuid.UUID
	Page              int
	Limit             int
}

type PaginatedVacancies struct {
	Items []VacancyListItem
	Total int
	Page  int
	Limit int
}
