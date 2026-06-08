package views

import (
	"time"

	"job-search-api/internal/models"
)

type UserResponse struct {
	ID    string          `json:"id"`
	Email string          `json:"email"`
	Role  models.UserRole `json:"role"`
}

type AuthResponse struct {
	AccessToken string       `json:"access_token"`
	User        UserResponse `json:"user"`
}

type CompanyResponse struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Website     string `json:"website"`
	City        string `json:"city"`
}

type ResumeResponse struct {
	ID              string         `json:"id"`
	Title           string         `json:"title"`
	ExperienceYears int            `json:"experience_years"`
	Education       string         `json:"education"`
	WorkExperience  string         `json:"work_experience"`
	ExpectedSalary  *int           `json:"expected_salary,omitempty"`
	Skills          []models.Skill `json:"skills"`
}

type VacancyResponse struct {
	ID              string                 `json:"id"`
	Company         CompanyResponse        `json:"company"`
	Industry        models.Industry        `json:"industry"`
	Title           string                 `json:"title"`
	Description     string                 `json:"description"`
	Requirements    string                 `json:"requirements"`
	SalaryFrom      *int                   `json:"salary_from,omitempty"`
	SalaryTo        *int                   `json:"salary_to,omitempty"`
	ExperienceLevel models.ExperienceLevel `json:"experience_level"`
	EmploymentType  models.EmploymentType  `json:"employment_type"`
	City            string                 `json:"city"`
	Status          models.VacancyStatus   `json:"status"`
	Skills          []models.Skill         `json:"skills"`
}

type VacancyListResponse struct {
	Items []VacancyResponse `json:"items"`
	Page  int               `json:"page"`
	Limit int               `json:"limit"`
	Total int               `json:"total"`
}

type ApplicationResponse struct {
	ID          string                   `json:"id"`
	VacancyID   string                   `json:"vacancy_id"`
	ResumeID    string                   `json:"resume_id"`
	Status      models.ApplicationStatus `json:"status"`
	CoverLetter string                   `json:"cover_letter"`
	CreatedAt   time.Time                `json:"created_at"`
}

func User(user *models.User) UserResponse {
	return UserResponse{
		ID:    user.ID,
		Email: user.Email,
		Role:  user.Role,
	}
}

func Auth(accessToken string, user *models.User) AuthResponse {
	return AuthResponse{
		AccessToken: accessToken,
		User:        User(user),
	}
}

func Company(company *models.Company) CompanyResponse {
	if company == nil {
		return CompanyResponse{}
	}

	return CompanyResponse{
		ID:          company.ID,
		Name:        company.Name,
		Description: company.Description,
		Website:     company.Website,
		City:        company.City,
	}
}

func Resume(resume *models.Resume, skills []models.Skill) ResumeResponse {
	return ResumeResponse{
		ID:              resume.ID,
		Title:           resume.Title,
		ExperienceYears: resume.ExperienceYears,
		Education:       resume.Education,
		WorkExperience:  resume.WorkExperience,
		ExpectedSalary:  resume.ExpectedSalary,
		Skills:          skills,
	}
}

func Vacancy(vacancy *models.Vacancy, company *models.Company, industry *models.Industry, skills []models.Skill) VacancyResponse {
	responseIndustry := models.Industry{}
	if industry != nil {
		responseIndustry = *industry
	}

	return VacancyResponse{
		ID:              vacancy.ID,
		Company:         Company(company),
		Industry:        responseIndustry,
		Title:           vacancy.Title,
		Description:     vacancy.Description,
		Requirements:    vacancy.Requirements,
		SalaryFrom:      vacancy.SalaryFrom,
		SalaryTo:        vacancy.SalaryTo,
		ExperienceLevel: vacancy.ExperienceLevel,
		EmploymentType:  vacancy.EmploymentType,
		City:            vacancy.City,
		Status:          vacancy.Status,
		Skills:          skills,
	}
}

func Application(application *models.Application) ApplicationResponse {
	return ApplicationResponse{
		ID:          application.ID,
		VacancyID:   application.VacancyID,
		ResumeID:    application.ResumeID,
		Status:      application.Status,
		CoverLetter: application.CoverLetter,
		CreatedAt:   application.CreatedAt,
	}
}
