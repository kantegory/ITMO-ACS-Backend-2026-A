package applicant

import (
	"context"
	"log"
	"net/http"
	"sort"
	"strings"
	"sync"
	"time"

	"job-search-microservices/internal/models"
	"job-search-microservices/internal/platform"
)

type Service struct {
	mu        sync.RWMutex
	auth      platform.Client
	catalog   platform.Client
	publisher platform.EventPublisher
	resumes   map[string]models.Resume
	apps      map[string]models.Application
}

type createResumeRequest struct {
	Title           string   `json:"title"`
	ExperienceYears int      `json:"experience_years"`
	Education       string   `json:"education"`
	WorkExperience  string   `json:"work_experience"`
	ExpectedSalary  *int     `json:"expected_salary"`
	SkillIDs        []string `json:"skill_ids"`
}

type createApplicationRequest struct {
	ResumeID    string `json:"resume_id"`
	CoverLetter string `json:"cover_letter"`
}

type updateStatusRequest struct {
	EmployerID string                   `json:"employer_id"`
	Status     models.ApplicationStatus `json:"status"`
}

func New(authURL string, catalogURL string) *Service {
	return NewWithPublisher(authURL, catalogURL, platform.NoopPublisher{})
}

func NewWithPublisher(authURL string, catalogURL string, publisher platform.EventPublisher) *Service {
	service := &Service{
		auth:      platform.NewClient(authURL),
		catalog:   platform.NewClient(catalogURL),
		publisher: publisher,
		resumes:   make(map[string]models.Resume),
		apps:      make(map[string]models.Application),
	}
	service.seed()
	return service
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
			platform.WriteJSON(w, http.StatusOK, map[string]string{"service": "applicant", "status": "ok"})
		}
	case "/applicant/resumes":
		switch r.Method {
		case http.MethodGet:
			service.listResumes(w, r)
		case http.MethodPost:
			service.createResume(w, r)
		default:
			platform.WriteError(w, platform.MethodNotAllowed())
		}
	case "/applicant/applications":
		if platform.RequireMethod(w, r, http.MethodGet) {
			service.listApplications(w, r)
		}
	default:
		service.routeDynamic(w, r, platform.SplitPath(path))
	}
}

func (service *Service) routeDynamic(w http.ResponseWriter, r *http.Request, parts []string) {
	if len(parts) == 3 && parts[0] == "vacancies" && parts[2] == "applications" {
		if platform.RequireMethod(w, r, http.MethodPost) {
			service.applyToVacancy(w, r, parts[1])
		}
		return
	}

	if len(parts) == 3 && parts[0] == "internal" && parts[1] == "applications" {
		if platform.RequireMethod(w, r, http.MethodGet) {
			service.getInternalApplication(w, parts[2])
		}
		return
	}

	if len(parts) == 4 && parts[0] == "internal" && parts[1] == "applications" && parts[3] == "status" {
		if platform.RequireMethod(w, r, http.MethodPatch) {
			service.updateInternalApplicationStatus(w, r, parts[2])
		}
		return
	}

	platform.WriteError(w, platform.NotFound("route not found"))
}

func (service *Service) listResumes(w http.ResponseWriter, r *http.Request) {
	user, err := service.currentUser(r)
	if err != nil {
		platform.WriteError(w, err)
		return
	}
	if user.Role != models.RoleApplicant {
		platform.WriteError(w, platform.Forbidden("only applicants can view resumes"))
		return
	}

	service.mu.RLock()
	resumes := make([]models.Resume, 0)
	for _, resume := range service.resumes {
		if resume.ApplicantID == user.ID {
			resumes = append(resumes, resume)
		}
	}
	service.mu.RUnlock()

	sort.Slice(resumes, func(left, right int) bool { return resumes[left].Title < resumes[right].Title })
	skills := service.skillLookup()
	for index := range resumes {
		resumes[index].Skills = skillsByIDs(skills, resumes[index].SkillIDs)
		resumes[index].ApplicantID = ""
	}

	platform.WriteJSON(w, http.StatusOK, resumes)
}

func (service *Service) createResume(w http.ResponseWriter, r *http.Request) {
	user, err := service.currentUser(r)
	if err != nil {
		platform.WriteError(w, err)
		return
	}
	if user.Role != models.RoleApplicant {
		platform.WriteError(w, platform.Forbidden("only applicants can create resumes"))
		return
	}

	var request createResumeRequest
	if err := platform.DecodeJSON(r, &request); err != nil {
		platform.WriteError(w, err)
		return
	}
	if err := validateResume(request); err != nil {
		platform.WriteError(w, err)
		return
	}

	resume := models.Resume{
		ID:              platform.NewID(),
		ApplicantID:     user.ID,
		Title:           strings.TrimSpace(request.Title),
		ExperienceYears: request.ExperienceYears,
		Education:       strings.TrimSpace(request.Education),
		WorkExperience:  strings.TrimSpace(request.WorkExperience),
		ExpectedSalary:  copyInt(request.ExpectedSalary),
		SkillIDs:        copyStrings(request.SkillIDs),
	}

	service.mu.Lock()
	service.resumes[resume.ID] = resume
	service.mu.Unlock()

	resume.Skills = skillsByIDs(service.skillLookup(), resume.SkillIDs)
	resume.ApplicantID = ""
	platform.WriteJSON(w, http.StatusCreated, resume)
}

func (service *Service) applyToVacancy(w http.ResponseWriter, r *http.Request, vacancyID string) {
	user, err := service.currentUser(r)
	if err != nil {
		platform.WriteError(w, err)
		return
	}
	if user.Role != models.RoleApplicant {
		platform.WriteError(w, platform.Forbidden("only applicants can apply to vacancies"))
		return
	}

	var request createApplicationRequest
	if err := platform.DecodeJSON(r, &request); err != nil {
		platform.WriteError(w, err)
		return
	}

	var vacancy models.Vacancy
	if err := service.catalog.Get("/internal/vacancies/"+vacancyID, "", &vacancy); err != nil {
		platform.WriteError(w, err)
		return
	}
	if vacancy.Status != models.VacancyPublished {
		platform.WriteError(w, platform.NotFound("vacancy not found"))
		return
	}

	service.mu.Lock()

	resume, ok := service.resumes[request.ResumeID]
	if !ok || resume.ApplicantID != user.ID {
		service.mu.Unlock()
		platform.WriteError(w, platform.NotFound("resume not found"))
		return
	}

	for _, application := range service.apps {
		if application.ApplicantID == user.ID && application.VacancyID == vacancyID && application.Status != models.ApplicationWithdrawn {
			service.mu.Unlock()
			platform.WriteError(w, platform.Conflict("application for this vacancy already exists"))
			return
		}
	}

	application := models.Application{
		ID:          platform.NewID(),
		VacancyID:   vacancyID,
		ApplicantID: user.ID,
		ResumeID:    resume.ID,
		Status:      models.ApplicationSubmitted,
		CoverLetter: strings.TrimSpace(request.CoverLetter),
		CreatedAt:   time.Now().UTC(),
	}
	service.apps[application.ID] = application
	service.mu.Unlock()

	service.publishApplicationCreated(application)

	response := application
	response.ApplicantID = ""
	platform.WriteJSON(w, http.StatusCreated, response)
}

func (service *Service) listApplications(w http.ResponseWriter, r *http.Request) {
	user, err := service.currentUser(r)
	if err != nil {
		platform.WriteError(w, err)
		return
	}
	if user.Role != models.RoleApplicant {
		platform.WriteError(w, platform.Forbidden("only applicants can view applications"))
		return
	}

	service.mu.RLock()
	applications := make([]models.Application, 0)
	for _, application := range service.apps {
		if application.ApplicantID == user.ID {
			application.ApplicantID = ""
			applications = append(applications, application)
		}
	}
	service.mu.RUnlock()

	sort.Slice(applications, func(left, right int) bool { return applications[left].CreatedAt.After(applications[right].CreatedAt) })
	platform.WriteJSON(w, http.StatusOK, applications)
}

func (service *Service) getInternalApplication(w http.ResponseWriter, applicationID string) {
	service.mu.RLock()
	defer service.mu.RUnlock()

	application, ok := service.apps[applicationID]
	if !ok {
		platform.WriteError(w, platform.NotFound("application not found"))
		return
	}
	platform.WriteJSON(w, http.StatusOK, application)
}

func (service *Service) updateInternalApplicationStatus(w http.ResponseWriter, r *http.Request, applicationID string) {
	var request updateStatusRequest
	if err := platform.DecodeJSON(r, &request); err != nil {
		platform.WriteError(w, err)
		return
	}
	if !request.Status.Valid() {
		platform.WriteError(w, platform.BadRequest("invalid application status"))
		return
	}

	service.mu.Lock()

	application, ok := service.apps[applicationID]
	if !ok {
		service.mu.Unlock()
		platform.WriteError(w, platform.NotFound("application not found"))
		return
	}

	var vacancy models.Vacancy
	if err := service.catalog.Get("/internal/vacancies/"+application.VacancyID, "", &vacancy); err != nil {
		service.mu.Unlock()
		platform.WriteError(w, err)
		return
	}
	if vacancy.EmployerID != request.EmployerID {
		service.mu.Unlock()
		platform.WriteError(w, platform.Forbidden("application belongs to another employer"))
		return
	}

	application.Status = request.Status
	service.apps[application.ID] = application
	service.mu.Unlock()

	service.publishApplicationStatusChanged(application)

	response := application
	response.ApplicantID = ""
	platform.WriteJSON(w, http.StatusOK, response)
}

func (service *Service) currentUser(r *http.Request) (models.User, error) {
	token, err := platform.BearerToken(r)
	if err != nil {
		return models.User{}, err
	}

	var user models.User
	if err := service.auth.Get("/internal/auth/user", token, &user); err != nil {
		return models.User{}, err
	}
	return user, nil
}

func (service *Service) skillLookup() map[string]models.Skill {
	var skills []models.Skill
	if err := service.catalog.Get("/skills", "", &skills); err != nil {
		return map[string]models.Skill{}
	}

	lookup := make(map[string]models.Skill, len(skills))
	for _, skill := range skills {
		lookup[skill.ID] = skill
	}
	return lookup
}

func validateResume(request createResumeRequest) error {
	if strings.TrimSpace(request.Title) == "" {
		return platform.BadRequest("title is required")
	}
	if request.ExperienceYears < 0 {
		return platform.BadRequest("experience_years must be positive")
	}
	if request.ExpectedSalary != nil && *request.ExpectedSalary < 0 {
		return platform.BadRequest("expected_salary must be positive")
	}
	if len(request.SkillIDs) == 0 {
		return platform.BadRequest("at least one skill_id is required")
	}
	return nil
}

func (service *Service) seed() {
	expectedSalary := 180000
	resume := models.Resume{
		ID:              "99999999-9999-4999-8999-999999999999",
		ApplicantID:     "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
		Title:           "Backend Developer",
		ExperienceYears: 2,
		Education:       "ITMO University",
		WorkExperience:  "Built REST APIs and internal services.",
		ExpectedSalary:  &expectedSalary,
		SkillIDs:        []string{"11111111-1111-4111-8111-111111111111", "33333333-3333-4333-8333-333333333333", "44444444-4444-4444-8444-444444444444"},
	}
	service.resumes[resume.ID] = resume
}

func (service *Service) publishApplicationCreated(application models.Application) {
	payload := map[string]any{
		"application_id": application.ID,
		"vacancy_id":     application.VacancyID,
		"resume_id":      application.ResumeID,
		"applicant_id":   application.ApplicantID,
		"status":         application.Status,
	}

	if err := service.publisher.Publish(context.Background(), "application.created", payload); err != nil {
		log.Printf("applicant-service failed to publish application.created: %v", err)
	}
}

func (service *Service) publishApplicationStatusChanged(application models.Application) {
	payload := map[string]any{
		"application_id": application.ID,
		"vacancy_id":     application.VacancyID,
		"applicant_id":   application.ApplicantID,
		"status":         application.Status,
	}

	if err := service.publisher.Publish(context.Background(), "application.status_changed", payload); err != nil {
		log.Printf("applicant-service failed to publish application.status_changed: %v", err)
	}
}

func skillsByIDs(lookup map[string]models.Skill, ids []string) []models.Skill {
	skills := make([]models.Skill, 0, len(ids))
	for _, id := range ids {
		if skill, ok := lookup[id]; ok {
			skills = append(skills, skill)
		}
	}
	return skills
}

func copyInt(value *int) *int {
	if value == nil {
		return nil
	}
	copied := *value
	return &copied
}

func copyStrings(values []string) []string {
	copied := make([]string, len(values))
	copy(copied, values)
	return copied
}
