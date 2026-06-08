package models

import "time"

type UserRole string

const (
	RoleApplicant UserRole = "applicant"
	RoleEmployer  UserRole = "employer"
)

func (role UserRole) Valid() bool {
	return role == RoleApplicant || role == RoleEmployer
}

type ExperienceLevel string

const (
	ExperienceNoExperience ExperienceLevel = "no_experience"
	ExperienceJunior       ExperienceLevel = "junior"
	ExperienceMiddle       ExperienceLevel = "middle"
	ExperienceSenior       ExperienceLevel = "senior"
)

func (level ExperienceLevel) Valid() bool {
	switch level {
	case ExperienceNoExperience, ExperienceJunior, ExperienceMiddle, ExperienceSenior:
		return true
	default:
		return false
	}
}

type EmploymentType string

const (
	EmploymentFullTime   EmploymentType = "full_time"
	EmploymentPartTime   EmploymentType = "part_time"
	EmploymentRemote     EmploymentType = "remote"
	EmploymentHybrid     EmploymentType = "hybrid"
	EmploymentInternship EmploymentType = "internship"
)

func (employmentType EmploymentType) Valid() bool {
	switch employmentType {
	case EmploymentFullTime, EmploymentPartTime, EmploymentRemote, EmploymentHybrid, EmploymentInternship:
		return true
	default:
		return false
	}
}

type VacancyStatus string

const (
	VacancyDraft     VacancyStatus = "draft"
	VacancyPublished VacancyStatus = "published"
	VacancyClosed    VacancyStatus = "closed"
	VacancyArchived  VacancyStatus = "archived"
)

func (status VacancyStatus) Valid() bool {
	switch status {
	case VacancyDraft, VacancyPublished, VacancyClosed, VacancyArchived:
		return true
	default:
		return false
	}
}

type ApplicationStatus string

const (
	ApplicationSubmitted ApplicationStatus = "submitted"
	ApplicationReviewing ApplicationStatus = "reviewing"
	ApplicationInvited   ApplicationStatus = "invited"
	ApplicationRejected  ApplicationStatus = "rejected"
	ApplicationHired     ApplicationStatus = "hired"
	ApplicationWithdrawn ApplicationStatus = "withdrawn"
)

func (status ApplicationStatus) Valid() bool {
	switch status {
	case ApplicationSubmitted, ApplicationReviewing, ApplicationInvited, ApplicationRejected, ApplicationHired, ApplicationWithdrawn:
		return true
	default:
		return false
	}
}

type User struct {
	ID           string
	Email        string
	PasswordHash string
	Role         UserRole
	FirstName    string
	LastName     string
	CompanyID    string
}

type Skill struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type Industry struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type Company struct {
	ID          string
	Name        string
	Description string
	Website     string
	City        string
}

type Resume struct {
	ID              string
	ApplicantID     string
	Title           string
	ExperienceYears int
	Education       string
	WorkExperience  string
	ExpectedSalary  *int
	SkillIDs        []string
}

type Vacancy struct {
	ID              string
	CompanyID       string
	EmployerID      string
	IndustryID      string
	Title           string
	Description     string
	Requirements    string
	SalaryFrom      *int
	SalaryTo        *int
	ExperienceLevel ExperienceLevel
	EmploymentType  EmploymentType
	City            string
	Status          VacancyStatus
	SkillIDs        []string
	CreatedAt       time.Time
}

type Application struct {
	ID          string
	VacancyID   string
	ApplicantID string
	ResumeID    string
	Status      ApplicationStatus
	CoverLetter string
	CreatedAt   time.Time
}
