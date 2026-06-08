package catalog

import (
	"net/http"
	"sort"
	"strings"
	"sync"
	"time"

	"job-search-microservices/internal/models"
	"job-search-microservices/internal/platform"
)

type Service struct {
	mu         sync.RWMutex
	skills     map[string]models.Skill
	industries map[string]models.Industry
	companies  map[string]models.Company
	vacancies  map[string]models.Vacancy
}

type vacancyRequest struct {
	CompanyID       string                 `json:"company_id"`
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

func New() *Service {
	service := &Service{
		skills:     make(map[string]models.Skill),
		industries: make(map[string]models.Industry),
		companies:  make(map[string]models.Company),
		vacancies:  make(map[string]models.Vacancy),
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
	if path == "" {
		path = "/"
	}

	switch path {
	case "/health":
		if platform.RequireMethod(w, r, http.MethodGet) {
			platform.WriteJSON(w, http.StatusOK, map[string]string{"service": "catalog", "status": "ok"})
		}
	case "/skills":
		if platform.RequireMethod(w, r, http.MethodGet) {
			service.listSkills(w)
		}
	case "/industries":
		if platform.RequireMethod(w, r, http.MethodGet) {
			service.listIndustries(w)
		}
	case "/vacancies":
		if platform.RequireMethod(w, r, http.MethodGet) {
			service.listPublicVacancies(w, r)
		}
	default:
		service.routeDynamic(w, r, platform.SplitPath(path))
	}
}

func (service *Service) routeDynamic(w http.ResponseWriter, r *http.Request, parts []string) {
	if len(parts) == 2 && parts[0] == "vacancies" {
		if platform.RequireMethod(w, r, http.MethodGet) {
			service.getPublicVacancy(w, parts[1])
		}
		return
	}

	if len(parts) == 3 && parts[0] == "internal" && parts[1] == "vacancies" {
		if platform.RequireMethod(w, r, http.MethodGet) {
			service.getInternalVacancy(w, parts[2])
		}
		return
	}

	if len(parts) == 4 && parts[0] == "internal" && parts[1] == "employers" && parts[3] == "vacancies" {
		switch r.Method {
		case http.MethodGet:
			service.listEmployerVacancies(w, parts[2])
		case http.MethodPost:
			service.createEmployerVacancy(w, r, parts[2])
		default:
			platform.WriteError(w, platform.MethodNotAllowed())
		}
		return
	}

	if len(parts) == 5 && parts[0] == "internal" && parts[1] == "employers" && parts[3] == "vacancies" {
		switch r.Method {
		case http.MethodPut:
			service.updateEmployerVacancy(w, r, parts[2], parts[4])
		case http.MethodDelete:
			service.closeEmployerVacancy(w, parts[2], parts[4])
		default:
			platform.WriteError(w, platform.MethodNotAllowed())
		}
		return
	}

	platform.WriteError(w, platform.NotFound("route not found"))
}

func (service *Service) listSkills(w http.ResponseWriter) {
	service.mu.RLock()
	defer service.mu.RUnlock()

	skills := make([]models.Skill, 0, len(service.skills))
	for _, skill := range service.skills {
		skills = append(skills, skill)
	}
	sort.Slice(skills, func(left, right int) bool { return skills[left].Name < skills[right].Name })

	platform.WriteJSON(w, http.StatusOK, skills)
}

func (service *Service) listIndustries(w http.ResponseWriter) {
	service.mu.RLock()
	defer service.mu.RUnlock()

	industries := make([]models.Industry, 0, len(service.industries))
	for _, industry := range service.industries {
		industries = append(industries, industry)
	}
	sort.Slice(industries, func(left, right int) bool { return industries[left].Name < industries[right].Name })

	platform.WriteJSON(w, http.StatusOK, industries)
}

func (service *Service) listPublicVacancies(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()

	page, err := platform.IntQuery(query.Get("page"), 1)
	if err != nil {
		platform.WriteError(w, platform.BadRequest("page must be an integer"))
		return
	}
	limit, err := platform.IntQuery(query.Get("limit"), 20)
	if err != nil {
		platform.WriteError(w, platform.BadRequest("limit must be an integer"))
		return
	}
	page, limit = platform.NormalizePagination(page, limit)

	salaryFrom, err := platform.OptionalIntQuery(query.Get("salary_from"))
	if err != nil {
		platform.WriteError(w, platform.BadRequest("salary_from must be an integer"))
		return
	}

	experienceLevel := models.ExperienceLevel(query.Get("experience_level"))
	if experienceLevel != "" && !experienceLevel.Valid() {
		platform.WriteError(w, platform.BadRequest("invalid experience_level"))
		return
	}

	filter := vacancyFilter{
		Search:          query.Get("search"),
		IndustryID:      query.Get("industry_id"),
		SkillIDs:        platform.CommaSeparated(query.Get("skill_ids")),
		SalaryFrom:      salaryFrom,
		ExperienceLevel: experienceLevel,
	}

	items, total := service.searchPublicVacancies(filter, page, limit)
	platform.WriteJSON(w, http.StatusOK, models.VacancyListResponse{Items: items, Page: page, Limit: limit, Total: total})
}

func (service *Service) getPublicVacancy(w http.ResponseWriter, vacancyID string) {
	service.mu.RLock()
	defer service.mu.RUnlock()

	vacancy, ok := service.vacancies[vacancyID]
	if !ok || vacancy.Status != models.VacancyPublished {
		platform.WriteError(w, platform.NotFound("vacancy not found"))
		return
	}

	platform.WriteJSON(w, http.StatusOK, service.publicVacancyLocked(vacancy))
}

func (service *Service) getInternalVacancy(w http.ResponseWriter, vacancyID string) {
	service.mu.RLock()
	defer service.mu.RUnlock()

	vacancy, ok := service.vacancies[vacancyID]
	if !ok {
		platform.WriteError(w, platform.NotFound("vacancy not found"))
		return
	}

	platform.WriteJSON(w, http.StatusOK, service.enrichVacancyLocked(vacancy))
}

func (service *Service) listEmployerVacancies(w http.ResponseWriter, employerID string) {
	service.mu.RLock()
	defer service.mu.RUnlock()

	vacancies := make([]models.Vacancy, 0)
	for _, vacancy := range service.vacancies {
		if vacancy.EmployerID == employerID {
			vacancies = append(vacancies, service.enrichVacancyLocked(vacancy))
		}
	}
	sort.Slice(vacancies, func(left, right int) bool { return vacancies[left].CreatedAt.After(vacancies[right].CreatedAt) })

	platform.WriteJSON(w, http.StatusOK, vacancies)
}

func (service *Service) createEmployerVacancy(w http.ResponseWriter, r *http.Request, employerID string) {
	var request vacancyRequest
	if err := platform.DecodeJSON(r, &request); err != nil {
		platform.WriteError(w, err)
		return
	}

	vacancy, err := service.createVacancy(employerID, request)
	if err != nil {
		platform.WriteError(w, err)
		return
	}

	platform.WriteJSON(w, http.StatusCreated, vacancy)
}

func (service *Service) updateEmployerVacancy(w http.ResponseWriter, r *http.Request, employerID string, vacancyID string) {
	var request vacancyRequest
	if err := platform.DecodeJSON(r, &request); err != nil {
		platform.WriteError(w, err)
		return
	}

	vacancy, err := service.updateVacancy(employerID, vacancyID, request)
	if err != nil {
		platform.WriteError(w, err)
		return
	}

	platform.WriteJSON(w, http.StatusOK, vacancy)
}

func (service *Service) closeEmployerVacancy(w http.ResponseWriter, employerID string, vacancyID string) {
	service.mu.Lock()
	defer service.mu.Unlock()

	vacancy, ok := service.vacancies[vacancyID]
	if !ok {
		platform.WriteError(w, platform.NotFound("vacancy not found"))
		return
	}
	if vacancy.EmployerID != employerID {
		platform.WriteError(w, platform.Forbidden("vacancy belongs to another employer"))
		return
	}

	vacancy.Status = models.VacancyClosed
	service.vacancies[vacancy.ID] = vacancy
	w.WriteHeader(http.StatusNoContent)
}

type vacancyFilter struct {
	Search          string
	IndustryID      string
	SkillIDs        []string
	SalaryFrom      *int
	ExperienceLevel models.ExperienceLevel
}

func (service *Service) searchPublicVacancies(filter vacancyFilter, page int, limit int) ([]models.Vacancy, int) {
	service.mu.RLock()
	defer service.mu.RUnlock()

	matches := make([]models.Vacancy, 0)
	for _, vacancy := range service.vacancies {
		if vacancy.Status != models.VacancyPublished || !matchesFilter(vacancy, filter) {
			continue
		}
		matches = append(matches, service.publicVacancyLocked(vacancy))
	}

	sort.Slice(matches, func(left, right int) bool { return matches[left].CreatedAt.After(matches[right].CreatedAt) })

	total := len(matches)
	start := (page - 1) * limit
	if start >= total {
		return []models.Vacancy{}, total
	}
	end := min(start+limit, total)
	return matches[start:end], total
}

func (service *Service) createVacancy(employerID string, request vacancyRequest) (models.Vacancy, error) {
	service.mu.Lock()
	defer service.mu.Unlock()

	if err := service.validateVacancyRequestLocked(request); err != nil {
		return models.Vacancy{}, err
	}

	status := request.Status
	if status == "" {
		status = models.VacancyPublished
	}

	vacancy := models.Vacancy{
		ID:              platform.NewID(),
		CompanyID:       request.CompanyID,
		EmployerID:      employerID,
		IndustryID:      request.IndustryID,
		Title:           strings.TrimSpace(request.Title),
		Description:     strings.TrimSpace(request.Description),
		Requirements:    strings.TrimSpace(request.Requirements),
		SalaryFrom:      copyInt(request.SalaryFrom),
		SalaryTo:        copyInt(request.SalaryTo),
		ExperienceLevel: request.ExperienceLevel,
		EmploymentType:  request.EmploymentType,
		City:            strings.TrimSpace(request.City),
		Status:          status,
		SkillIDs:        copyStrings(request.SkillIDs),
		CreatedAt:       time.Now().UTC(),
	}
	service.vacancies[vacancy.ID] = vacancy

	return service.enrichVacancyLocked(vacancy), nil
}

func (service *Service) updateVacancy(employerID string, vacancyID string, request vacancyRequest) (models.Vacancy, error) {
	service.mu.Lock()
	defer service.mu.Unlock()

	vacancy, ok := service.vacancies[vacancyID]
	if !ok {
		return models.Vacancy{}, platform.NotFound("vacancy not found")
	}
	if vacancy.EmployerID != employerID {
		return models.Vacancy{}, platform.Forbidden("vacancy belongs to another employer")
	}
	if err := service.validateVacancyRequestLocked(request); err != nil {
		return models.Vacancy{}, err
	}

	status := request.Status
	if status == "" {
		status = vacancy.Status
	}

	vacancy.CompanyID = request.CompanyID
	vacancy.IndustryID = request.IndustryID
	vacancy.Title = strings.TrimSpace(request.Title)
	vacancy.Description = strings.TrimSpace(request.Description)
	vacancy.Requirements = strings.TrimSpace(request.Requirements)
	vacancy.SalaryFrom = copyInt(request.SalaryFrom)
	vacancy.SalaryTo = copyInt(request.SalaryTo)
	vacancy.ExperienceLevel = request.ExperienceLevel
	vacancy.EmploymentType = request.EmploymentType
	vacancy.City = strings.TrimSpace(request.City)
	vacancy.Status = status
	vacancy.SkillIDs = copyStrings(request.SkillIDs)

	service.vacancies[vacancy.ID] = vacancy
	return service.enrichVacancyLocked(vacancy), nil
}

func (service *Service) validateVacancyRequestLocked(request vacancyRequest) error {
	if request.CompanyID == "" {
		return platform.BadRequest("company_id is required")
	}
	if _, ok := service.companies[request.CompanyID]; !ok {
		return platform.BadRequest("unknown company_id")
	}
	if _, ok := service.industries[request.IndustryID]; !ok {
		return platform.BadRequest("unknown industry_id")
	}
	if strings.TrimSpace(request.Title) == "" {
		return platform.BadRequest("title is required")
	}
	if strings.TrimSpace(request.Description) == "" {
		return platform.BadRequest("description is required")
	}
	if strings.TrimSpace(request.Requirements) == "" {
		return platform.BadRequest("requirements are required")
	}
	if !request.ExperienceLevel.Valid() {
		return platform.BadRequest("invalid experience_level")
	}
	if !request.EmploymentType.Valid() {
		return platform.BadRequest("invalid employment_type")
	}
	if request.Status != "" && !request.Status.Valid() {
		return platform.BadRequest("invalid vacancy status")
	}
	if len(request.SkillIDs) == 0 {
		return platform.BadRequest("at least one skill_id is required")
	}
	for _, skillID := range request.SkillIDs {
		if _, ok := service.skills[skillID]; !ok {
			return platform.BadRequest("unknown skill_id: " + skillID)
		}
	}
	if request.SalaryFrom != nil && *request.SalaryFrom < 0 {
		return platform.BadRequest("salary_from must be positive")
	}
	if request.SalaryTo != nil && *request.SalaryTo < 0 {
		return platform.BadRequest("salary_to must be positive")
	}
	if request.SalaryFrom != nil && request.SalaryTo != nil && *request.SalaryTo < *request.SalaryFrom {
		return platform.BadRequest("salary_to must be greater than salary_from")
	}
	return nil
}

func (service *Service) enrichVacancyLocked(vacancy models.Vacancy) models.Vacancy {
	vacancy.Company = service.companies[vacancy.CompanyID]
	vacancy.Industry = service.industries[vacancy.IndustryID]
	vacancy.Skills = make([]models.Skill, 0, len(vacancy.SkillIDs))
	for _, skillID := range vacancy.SkillIDs {
		if skill, ok := service.skills[skillID]; ok {
			vacancy.Skills = append(vacancy.Skills, skill)
		}
	}
	return vacancy
}

func (service *Service) publicVacancyLocked(vacancy models.Vacancy) models.Vacancy {
	vacancy = service.enrichVacancyLocked(vacancy)
	vacancy.CompanyID = ""
	vacancy.EmployerID = ""
	vacancy.IndustryID = ""
	vacancy.SkillIDs = nil
	vacancy.CreatedAt = time.Time{}
	return vacancy
}

func matchesFilter(vacancy models.Vacancy, filter vacancyFilter) bool {
	if filter.Search != "" {
		query := strings.ToLower(strings.TrimSpace(filter.Search))
		text := strings.ToLower(vacancy.Title + " " + vacancy.Description + " " + vacancy.Requirements)
		if !strings.Contains(text, query) {
			return false
		}
	}
	if filter.IndustryID != "" && vacancy.IndustryID != filter.IndustryID {
		return false
	}
	if len(filter.SkillIDs) > 0 && !containsAll(vacancy.SkillIDs, filter.SkillIDs) {
		return false
	}
	if filter.SalaryFrom != nil {
		if vacancy.SalaryFrom == nil || *vacancy.SalaryFrom < *filter.SalaryFrom {
			return false
		}
	}
	if filter.ExperienceLevel != "" && vacancy.ExperienceLevel != filter.ExperienceLevel {
		return false
	}
	return true
}

func containsAll(values []string, required []string) bool {
	lookup := make(map[string]struct{}, len(values))
	for _, value := range values {
		lookup[value] = struct{}{}
	}
	for _, value := range required {
		if _, ok := lookup[value]; !ok {
			return false
		}
	}
	return true
}

func (service *Service) seed() {
	for _, skill := range []models.Skill{
		{ID: "11111111-1111-4111-8111-111111111111", Name: "Go"},
		{ID: "22222222-2222-4222-8222-222222222222", Name: "TypeScript"},
		{ID: "33333333-3333-4333-8333-333333333333", Name: "PostgreSQL"},
		{ID: "44444444-4444-4444-8444-444444444444", Name: "Docker"},
	} {
		service.skills[skill.ID] = skill
	}

	for _, industry := range []models.Industry{
		{ID: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", Name: "Information Technology"},
		{ID: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", Name: "Finance"},
		{ID: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", Name: "Education"},
	} {
		service.industries[industry.ID] = industry
	}

	company := models.Company{
		ID:          "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
		Name:        "TechNova",
		Description: "Product company building cloud services for job matching.",
		Website:     "https://technova.example",
		City:        "Saint Petersburg",
	}
	service.companies[company.ID] = company

	salaryFrom := 160000
	salaryTo := 260000
	vacancy := models.Vacancy{
		ID:              "88888888-8888-4888-8888-888888888888",
		CompanyID:       company.ID,
		EmployerID:      "ffffffff-ffff-4fff-8fff-ffffffffffff",
		IndustryID:      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
		Title:           "Go Backend Developer",
		Description:     "Develop REST API for job search services.",
		Requirements:    "Go, PostgreSQL, Docker, REST API design.",
		SalaryFrom:      &salaryFrom,
		SalaryTo:        &salaryTo,
		ExperienceLevel: models.ExperienceMiddle,
		EmploymentType:  models.EmploymentHybrid,
		City:            "Saint Petersburg",
		Status:          models.VacancyPublished,
		SkillIDs:        []string{"11111111-1111-4111-8111-111111111111", "33333333-3333-4333-8333-333333333333", "44444444-4444-4444-8444-444444444444"},
		CreatedAt:       time.Now().UTC().Add(-time.Hour),
	}
	service.vacancies[vacancy.ID] = vacancy
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
