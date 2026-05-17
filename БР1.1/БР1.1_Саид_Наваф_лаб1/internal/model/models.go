package model

import "time"

type User struct {
	ID           int       `json:"id"`
	Email        string    `json:"email"`
	Phone        string    `json:"phone,omitempty"`
	Role         string    `json:"role"`
	PasswordHash string    `json:"-"`
	RegisteredAt time.Time `json:"registered_at"`
}

type Applicant struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	PhotoURL  string    `json:"photo_url,omitempty"`
	BirthDate time.Time `json:"birth_date,omitempty"`
}

type Employer struct {
	ID          int    `json:"id"`
	UserID      int    `json:"user_id"`
	CompanyName string `json:"company_name"`
	LogoURL     string `json:"logo_url,omitempty"`
	Description string `json:"description,omitempty"`
	Website     string `json:"website,omitempty"`
	INN         string `json:"inn,omitempty"`
}

type Category struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
	Slug string `json:"slug"`
}

type Resume struct {
	ID              int       `json:"id"`
	ApplicantID     int       `json:"applicant_id"`
	DesiredPosition string    `json:"desired_position"`
	ExpectedSalary  int       `json:"expected_salary,omitempty"`
	Experience      int       `json:"experience,omitempty"`
	About           string    `json:"about,omitempty"`
	IsActive        bool      `json:"is_active"`
	CreatedAt       time.Time `json:"created_at"`
}

type WorkExperience struct {
	ID               int        `json:"id"`
	ResumeID         int        `json:"resume_id"`
	CompanyName      string     `json:"company_name"`
	Position         string     `json:"position"`
	StartDate        time.Time  `json:"start_date"`
	EndDate          *time.Time `json:"end_date,omitempty"`
	Responsibilities string     `json:"responsibilities,omitempty"`
	IsCurrent        bool       `json:"is_current"`
	CreatedAt        time.Time  `json:"created_at"`
}

type Vacancy struct {
	ID                 int       `json:"id"`
	EmployerID         int       `json:"employer_id"`
	CategoryID         int       `json:"category_id,omitempty"`
	Title              string    `json:"title"`
	Description        string    `json:"description"`
	Requirements       string    `json:"requirements,omitempty"`
	WorkingConditions  string    `json:"working_conditions,omitempty"`
	SalaryMin          int       `json:"salary_min,omitempty"`
	SalaryMax          int       `json:"salary_max,omitempty"`
	ExperienceRequired int       `json:"experience_required,omitempty"`
	City               string    `json:"city,omitempty"`
	Address            string    `json:"address,omitempty"`
	IsActive           bool      `json:"is_active"`
	CreatedAt          time.Time `json:"created_at"`
}

type Application struct {
	ID        int       `json:"id"`
	VacancyID int       `json:"vacancy_id"`
	ResumeID  int       `json:"resume_id"`
	Status    string    `json:"status"`
	AppliedAt time.Time `json:"applied_at"`
}

// --- Структуры для Auth ---

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Phone    string `json:"phone,omitempty"`
	Role     string `json:"role"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}