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
	ID        string   `json:"id"`
	Email     string   `json:"email"`
	Role      UserRole `json:"role"`
	FirstName string   `json:"first_name,omitempty"`
	LastName  string   `json:"last_name,omitempty"`
	CompanyID string   `json:"company_id,omitempty"`
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
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Website     string `json:"website"`
	City        string `json:"city"`
}

type Resume struct {
	ID              string   `json:"id"`
	ApplicantID     string   `json:"applicant_id,omitempty"`
	Title           string   `json:"title"`
	ExperienceYears int      `json:"experience_years"`
	Education       string   `json:"education"`
	WorkExperience  string   `json:"work_experience"`
	ExpectedSalary  *int     `json:"expected_salary,omitempty"`
	SkillIDs        []string `json:"skill_ids,omitempty"`
	Skills          []Skill  `json:"skills,omitempty"`
}

type Vacancy struct {
	ID              string          `json:"id"`
	CompanyID       string          `json:"company_id,omitempty"`
	EmployerID      string          `json:"employer_id,omitempty"`
	IndustryID      string          `json:"industry_id,omitempty"`
	Company         Company         `json:"company"`
	Industry        Industry        `json:"industry"`
	Title           string          `json:"title"`
	Description     string          `json:"description"`
	Requirements    string          `json:"requirements"`
	SalaryFrom      *int            `json:"salary_from,omitempty"`
	SalaryTo        *int            `json:"salary_to,omitempty"`
	ExperienceLevel ExperienceLevel `json:"experience_level"`
	EmploymentType  EmploymentType  `json:"employment_type"`
	City            string          `json:"city"`
	Status          VacancyStatus   `json:"status"`
	SkillIDs        []string        `json:"skill_ids,omitempty"`
	Skills          []Skill         `json:"skills"`
	CreatedAt       time.Time       `json:"-"`
}

type Application struct {
	ID          string            `json:"id"`
	VacancyID   string            `json:"vacancy_id"`
	ApplicantID string            `json:"applicant_id,omitempty"`
	ResumeID    string            `json:"resume_id"`
	Status      ApplicationStatus `json:"status"`
	CoverLetter string            `json:"cover_letter"`
	CreatedAt   time.Time         `json:"created_at"`
}

type VacancyListResponse struct {
	Items []Vacancy `json:"items"`
	Page  int       `json:"page"`
	Limit int       `json:"limit"`
	Total int       `json:"total"`
}

type AuthResponse struct {
	AccessToken string `json:"access_token"`
	User        User   `json:"user"`
}
