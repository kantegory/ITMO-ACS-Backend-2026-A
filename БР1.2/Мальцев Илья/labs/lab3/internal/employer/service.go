package employer

import (
	"net/http"
	"strings"

	"job-search-microservices/internal/models"
	"job-search-microservices/internal/platform"
)

type Service struct {
	auth      platform.Client
	catalog   platform.Client
	applicant platform.Client
}

type vacancyRequest struct {
	CompanyID       string                 `json:"company_id,omitempty"`
	IndustryID      string                 `json:"industry_id"`
	Title           string                 `json:"title"`
	Description     string                 `json:"description"`
	Requirements    string                 `json:"requirements"`
	SalaryFrom      *int                   `json:"salary_from"`
	SalaryTo        *int                   `json:"salary_to"`
	ExperienceLevel models.ExperienceLevel `json:"experience_level"`
	EmploymentType  models.EmploymentType  `json:"employment_type"`
	City            string                 `json:"city"`
	Status          models.VacancyStatus   `json:"status"`
	SkillIDs        []string               `json:"skill_ids"`
}

type updateStatusRequest struct {
	Status models.ApplicationStatus `json:"status"`
}

func New(authURL string, catalogURL string, applicantURL string) *Service {
	return &Service{
		auth:      platform.NewClient(authURL),
		catalog:   platform.NewClient(catalogURL),
		applicant: platform.NewClient(applicantURL),
	}
}

func (service *Service) Handler() http.Handler {
	return service
}

func (service *Service) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	platform.CORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	path := strings.TrimRight(r.URL.Path, "/")
	switch path {
	case "/health":
		if platform.RequireMethod(w, r, http.MethodGet) {
			platform.WriteJSON(w, http.StatusOK, map[string]string{"service": "employer", "status": "ok"})
		}
	case "/employer/vacancies":
		switch r.Method {
		case http.MethodGet:
			service.listVacancies(w, r)
		case http.MethodPost:
			service.createVacancy(w, r)
		default:
			platform.WriteError(w, platform.MethodNotAllowed())
		}
	default:
		service.routeDynamic(w, r, platform.SplitPath(path))
	}
}

func (service *Service) routeDynamic(w http.ResponseWriter, r *http.Request, parts []string) {
	if len(parts) == 3 && parts[0] == "employer" && parts[1] == "vacancies" {
		switch r.Method {
		case http.MethodPut:
			service.updateVacancy(w, r, parts[2])
		case http.MethodDelete:
			service.closeVacancy(w, r, parts[2])
		default:
			platform.WriteError(w, platform.MethodNotAllowed())
		}
		return
	}

	if len(parts) == 4 && parts[0] == "employer" && parts[1] == "applications" && parts[3] == "status" {
		if platform.RequireMethod(w, r, http.MethodPatch) {
			service.updateApplicationStatus(w, r, parts[2])
		}
		return
	}

	platform.WriteError(w, platform.NotFound("route not found"))
}

func (service *Service) listVacancies(w http.ResponseWriter, r *http.Request) {
	user, err := service.currentEmployer(r)
	if err != nil {
		platform.WriteError(w, err)
		return
	}

	var vacancies []models.Vacancy
	if err := service.catalog.Get("/internal/employers/"+user.ID+"/vacancies", "", &vacancies); err != nil {
		platform.WriteError(w, err)
		return
	}

	platform.WriteJSON(w, http.StatusOK, vacancies)
}

func (service *Service) createVacancy(w http.ResponseWriter, r *http.Request) {
	user, err := service.currentEmployer(r)
	if err != nil {
		platform.WriteError(w, err)
		return
	}

	var request vacancyRequest
	if err := platform.DecodeJSON(r, &request); err != nil {
		platform.WriteError(w, err)
		return
	}
	request.CompanyID = user.CompanyID

	var vacancy models.Vacancy
	if err := service.catalog.Post("/internal/employers/"+user.ID+"/vacancies", "", request, &vacancy); err != nil {
		platform.WriteError(w, err)
		return
	}

	platform.WriteJSON(w, http.StatusCreated, vacancy)
}

func (service *Service) updateVacancy(w http.ResponseWriter, r *http.Request, vacancyID string) {
	user, err := service.currentEmployer(r)
	if err != nil {
		platform.WriteError(w, err)
		return
	}

	var request vacancyRequest
	if err := platform.DecodeJSON(r, &request); err != nil {
		platform.WriteError(w, err)
		return
	}
	request.CompanyID = user.CompanyID

	var vacancy models.Vacancy
	if err := service.catalog.Put("/internal/employers/"+user.ID+"/vacancies/"+vacancyID, "", request, &vacancy); err != nil {
		platform.WriteError(w, err)
		return
	}

	platform.WriteJSON(w, http.StatusOK, vacancy)
}

func (service *Service) closeVacancy(w http.ResponseWriter, r *http.Request, vacancyID string) {
	user, err := service.currentEmployer(r)
	if err != nil {
		platform.WriteError(w, err)
		return
	}

	if err := service.catalog.Delete("/internal/employers/"+user.ID+"/vacancies/"+vacancyID, ""); err != nil {
		platform.WriteError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (service *Service) updateApplicationStatus(w http.ResponseWriter, r *http.Request, applicationID string) {
	user, err := service.currentEmployer(r)
	if err != nil {
		platform.WriteError(w, err)
		return
	}

	var request updateStatusRequest
	if err := platform.DecodeJSON(r, &request); err != nil {
		platform.WriteError(w, err)
		return
	}

	payload := map[string]any{
		"employer_id": user.ID,
		"status":      request.Status,
	}

	var application models.Application
	if err := service.applicant.Patch("/internal/applications/"+applicationID+"/status", "", payload, &application); err != nil {
		platform.WriteError(w, err)
		return
	}

	platform.WriteJSON(w, http.StatusOK, application)
}

func (service *Service) currentEmployer(r *http.Request) (models.User, error) {
	token, err := platform.BearerToken(r)
	if err != nil {
		return models.User{}, err
	}

	var user models.User
	if err := service.auth.Get("/internal/auth/user", token, &user); err != nil {
		return models.User{}, err
	}
	if user.Role != models.RoleEmployer {
		return models.User{}, platform.Forbidden("only employers can use this endpoint")
	}
	if user.CompanyID == "" {
		return models.User{}, platform.Forbidden("employer has no company")
	}
	return user, nil
}
