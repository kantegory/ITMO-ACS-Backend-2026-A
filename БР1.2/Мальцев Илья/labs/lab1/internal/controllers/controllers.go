package controllers

import (
	"net/http"
	"strconv"
	"strings"

	"job-search-api/internal/errs"
	"job-search-api/internal/httpx"
	"job-search-api/internal/models"
	"job-search-api/internal/store"
	"job-search-api/internal/views"
)

type AuthController struct {
	store *store.Store
}

type DictionaryController struct {
	store *store.Store
}

type VacancyController struct {
	store *store.Store
}

type ApplicantController struct {
	store *store.Store
}

type EmployerController struct {
	store *store.Store
}

type RegisterRequest struct {
	Email       string          `json:"email"`
	Password    string          `json:"password"`
	Role        models.UserRole `json:"role"`
	FirstName   string          `json:"first_name"`
	LastName    string          `json:"last_name"`
	CompanyName string          `json:"company_name"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type CreateResumeRequest struct {
	Title           string   `json:"title"`
	ExperienceYears int      `json:"experience_years"`
	Education       string   `json:"education"`
	WorkExperience  string   `json:"work_experience"`
	ExpectedSalary  *int     `json:"expected_salary"`
	SkillIDs        []string `json:"skill_ids"`
}

type CreateApplicationRequest struct {
	ResumeID    string `json:"resume_id"`
	CoverLetter string `json:"cover_letter"`
}

type CreateVacancyRequest struct {
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

type UpdateApplicationStatusRequest struct {
	Status models.ApplicationStatus `json:"status"`
}

func NewAuthController(store *store.Store) *AuthController {
	return &AuthController{store: store}
}

func NewDictionaryController(store *store.Store) *DictionaryController {
	return &DictionaryController{store: store}
}

func NewVacancyController(store *store.Store) *VacancyController {
	return &VacancyController{store: store}
}

func NewApplicantController(store *store.Store) *ApplicantController {
	return &ApplicantController{store: store}
}

func NewEmployerController(store *store.Store) *EmployerController {
	return &EmployerController{store: store}
}

func (controller *AuthController) Register(w http.ResponseWriter, r *http.Request) {
	var request RegisterRequest
	if err := httpx.DecodeJSON(r, &request); err != nil {
		httpx.WriteError(w, err)
		return
	}

	user, token, err := controller.store.Register(store.RegisterInput{
		Email:       request.Email,
		Password:    request.Password,
		Role:        request.Role,
		FirstName:   request.FirstName,
		LastName:    request.LastName,
		CompanyName: request.CompanyName,
	})
	if err != nil {
		httpx.WriteError(w, err)
		return
	}

	httpx.WriteJSON(w, http.StatusCreated, views.Auth(token, user))
}

func (controller *AuthController) Login(w http.ResponseWriter, r *http.Request) {
	var request LoginRequest
	if err := httpx.DecodeJSON(r, &request); err != nil {
		httpx.WriteError(w, err)
		return
	}

	user, token, err := controller.store.Login(store.LoginInput{
		Email:    request.Email,
		Password: request.Password,
	})
	if err != nil {
		httpx.WriteError(w, err)
		return
	}

	httpx.WriteJSON(w, http.StatusOK, views.Auth(token, user))
}

func (controller *AuthController) Me(w http.ResponseWriter, r *http.Request) {
	user, err := currentUser(r, controller.store)
	if err != nil {
		httpx.WriteError(w, err)
		return
	}

	httpx.WriteJSON(w, http.StatusOK, views.User(user))
}

func (controller *DictionaryController) ListSkills(w http.ResponseWriter, _ *http.Request) {
	httpx.WriteJSON(w, http.StatusOK, controller.store.ListSkills())
}

func (controller *DictionaryController) ListIndustries(w http.ResponseWriter, _ *http.Request) {
	httpx.WriteJSON(w, http.StatusOK, controller.store.ListIndustries())
}

func (controller *VacancyController) List(w http.ResponseWriter, r *http.Request) {
	filter, page, limit, err := vacancyFilterFromRequest(r)
	if err != nil {
		httpx.WriteError(w, err)
		return
	}

	vacancies, total := controller.store.SearchVacancies(filter)
	items := make([]views.VacancyResponse, 0, len(vacancies))
	for _, vacancy := range vacancies {
		items = append(items, vacancyResponse(controller.store, vacancy))
	}

	httpx.WriteJSON(w, http.StatusOK, views.VacancyListResponse{
		Items: items,
		Page:  page,
		Limit: limit,
		Total: total,
	})
}

func (controller *VacancyController) Get(w http.ResponseWriter, _ *http.Request, vacancyID string) {
	vacancy, err := controller.store.PublicVacancyByID(vacancyID)
	if err != nil {
		httpx.WriteError(w, err)
		return
	}

	httpx.WriteJSON(w, http.StatusOK, vacancyResponse(controller.store, vacancy))
}

func (controller *ApplicantController) ListResumes(w http.ResponseWriter, r *http.Request) {
	user, err := currentUser(r, controller.store)
	if err != nil {
		httpx.WriteError(w, err)
		return
	}

	resumes, err := controller.store.ApplicantResumes(user)
	if err != nil {
		httpx.WriteError(w, err)
		return
	}

	response := make([]views.ResumeResponse, 0, len(resumes))
	for _, resume := range resumes {
		response = append(response, resumeResponse(controller.store, resume))
	}

	httpx.WriteJSON(w, http.StatusOK, response)
}

func (controller *ApplicantController) CreateResume(w http.ResponseWriter, r *http.Request) {
	user, err := currentUser(r, controller.store)
	if err != nil {
		httpx.WriteError(w, err)
		return
	}

	var request CreateResumeRequest
	if err := httpx.DecodeJSON(r, &request); err != nil {
		httpx.WriteError(w, err)
		return
	}

	resume, err := controller.store.CreateResume(user, store.CreateResumeInput{
		Title:           request.Title,
		ExperienceYears: request.ExperienceYears,
		Education:       request.Education,
		WorkExperience:  request.WorkExperience,
		ExpectedSalary:  request.ExpectedSalary,
		SkillIDs:        request.SkillIDs,
	})
	if err != nil {
		httpx.WriteError(w, err)
		return
	}

	httpx.WriteJSON(w, http.StatusCreated, resumeResponse(controller.store, resume))
}

func (controller *ApplicantController) CreateApplication(w http.ResponseWriter, r *http.Request, vacancyID string) {
	user, err := currentUser(r, controller.store)
	if err != nil {
		httpx.WriteError(w, err)
		return
	}

	var request CreateApplicationRequest
	if err := httpx.DecodeJSON(r, &request); err != nil {
		httpx.WriteError(w, err)
		return
	}

	application, err := controller.store.CreateApplication(user, vacancyID, request.ResumeID, request.CoverLetter)
	if err != nil {
		httpx.WriteError(w, err)
		return
	}

	httpx.WriteJSON(w, http.StatusCreated, views.Application(application))
}

func (controller *ApplicantController) ListApplications(w http.ResponseWriter, r *http.Request) {
	user, err := currentUser(r, controller.store)
	if err != nil {
		httpx.WriteError(w, err)
		return
	}

	applications, err := controller.store.ApplicantApplications(user)
	if err != nil {
		httpx.WriteError(w, err)
		return
	}

	response := make([]views.ApplicationResponse, 0, len(applications))
	for _, application := range applications {
		response = append(response, views.Application(application))
	}

	httpx.WriteJSON(w, http.StatusOK, response)
}

func (controller *EmployerController) ListVacancies(w http.ResponseWriter, r *http.Request) {
	user, err := currentUser(r, controller.store)
	if err != nil {
		httpx.WriteError(w, err)
		return
	}

	vacancies, err := controller.store.EmployerVacancies(user)
	if err != nil {
		httpx.WriteError(w, err)
		return
	}

	response := make([]views.VacancyResponse, 0, len(vacancies))
	for _, vacancy := range vacancies {
		response = append(response, vacancyResponse(controller.store, vacancy))
	}

	httpx.WriteJSON(w, http.StatusOK, response)
}

func (controller *EmployerController) CreateVacancy(w http.ResponseWriter, r *http.Request) {
	user, err := currentUser(r, controller.store)
	if err != nil {
		httpx.WriteError(w, err)
		return
	}

	input, err := vacancyInputFromRequest(r)
	if err != nil {
		httpx.WriteError(w, err)
		return
	}

	vacancy, err := controller.store.CreateVacancy(user, input)
	if err != nil {
		httpx.WriteError(w, err)
		return
	}

	httpx.WriteJSON(w, http.StatusCreated, vacancyResponse(controller.store, vacancy))
}

func (controller *EmployerController) UpdateVacancy(w http.ResponseWriter, r *http.Request, vacancyID string) {
	user, err := currentUser(r, controller.store)
	if err != nil {
		httpx.WriteError(w, err)
		return
	}

	input, err := vacancyInputFromRequest(r)
	if err != nil {
		httpx.WriteError(w, err)
		return
	}

	vacancy, err := controller.store.UpdateVacancy(user, vacancyID, input)
	if err != nil {
		httpx.WriteError(w, err)
		return
	}

	httpx.WriteJSON(w, http.StatusOK, vacancyResponse(controller.store, vacancy))
}

func (controller *EmployerController) CloseVacancy(w http.ResponseWriter, r *http.Request, vacancyID string) {
	user, err := currentUser(r, controller.store)
	if err != nil {
		httpx.WriteError(w, err)
		return
	}

	if err := controller.store.CloseVacancy(user, vacancyID); err != nil {
		httpx.WriteError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (controller *EmployerController) UpdateApplicationStatus(w http.ResponseWriter, r *http.Request, applicationID string) {
	user, err := currentUser(r, controller.store)
	if err != nil {
		httpx.WriteError(w, err)
		return
	}

	var request UpdateApplicationStatusRequest
	if err := httpx.DecodeJSON(r, &request); err != nil {
		httpx.WriteError(w, err)
		return
	}

	application, err := controller.store.UpdateApplicationStatus(user, applicationID, request.Status)
	if err != nil {
		httpx.WriteError(w, err)
		return
	}

	httpx.WriteJSON(w, http.StatusOK, views.Application(application))
}

func currentUser(r *http.Request, store *store.Store) (*models.User, error) {
	header := strings.TrimSpace(r.Header.Get("Authorization"))
	if header == "" {
		return nil, errs.Unauthorized("authorization header is required")
	}

	const prefix = "Bearer "
	if !strings.HasPrefix(header, prefix) {
		return nil, errs.Unauthorized("authorization header must use Bearer scheme")
	}

	token := strings.TrimSpace(strings.TrimPrefix(header, prefix))
	if token == "" {
		return nil, errs.Unauthorized("access token is required")
	}

	return store.Authenticate(token)
}

func vacancyFilterFromRequest(r *http.Request) (store.VacancyFilter, int, int, error) {
	query := r.URL.Query()

	page, err := queryInt(query.Get("page"), 1)
	if err != nil {
		return store.VacancyFilter{}, 0, 0, errs.BadRequest("page must be an integer")
	}

	limit, err := queryInt(query.Get("limit"), 20)
	if err != nil {
		return store.VacancyFilter{}, 0, 0, errs.BadRequest("limit must be an integer")
	}
	page, limit = normalizePagination(page, limit)

	salaryFrom, err := optionalQueryInt(query.Get("salary_from"))
	if err != nil {
		return store.VacancyFilter{}, 0, 0, errs.BadRequest("salary_from must be an integer")
	}

	experienceLevel := models.ExperienceLevel(query.Get("experience_level"))
	if experienceLevel != "" && !experienceLevel.Valid() {
		return store.VacancyFilter{}, 0, 0, errs.BadRequest("invalid experience_level")
	}

	filter := store.VacancyFilter{
		Search:          query.Get("search"),
		IndustryID:      query.Get("industry_id"),
		SkillIDs:        commaSeparatedIDs(query.Get("skill_ids")),
		SalaryFrom:      salaryFrom,
		ExperienceLevel: experienceLevel,
		Page:            page,
		Limit:           limit,
	}

	return filter, page, limit, nil
}

func vacancyInputFromRequest(r *http.Request) (store.CreateVacancyInput, error) {
	var request CreateVacancyRequest
	if err := httpx.DecodeJSON(r, &request); err != nil {
		return store.CreateVacancyInput{}, err
	}

	return store.CreateVacancyInput{
		IndustryID:      request.IndustryID,
		Title:           request.Title,
		Description:     request.Description,
		Requirements:    request.Requirements,
		SalaryFrom:      request.SalaryFrom,
		SalaryTo:        request.SalaryTo,
		ExperienceLevel: request.ExperienceLevel,
		EmploymentType:  request.EmploymentType,
		City:            request.City,
		Status:          request.Status,
		SkillIDs:        request.SkillIDs,
	}, nil
}

func queryInt(raw string, defaultValue int) (int, error) {
	if strings.TrimSpace(raw) == "" {
		return defaultValue, nil
	}

	return strconv.Atoi(raw)
}

func optionalQueryInt(raw string) (*int, error) {
	if strings.TrimSpace(raw) == "" {
		return nil, nil
	}

	value, err := strconv.Atoi(raw)
	if err != nil {
		return nil, err
	}

	return &value, nil
}

func commaSeparatedIDs(raw string) []string {
	if strings.TrimSpace(raw) == "" {
		return nil
	}

	parts := strings.Split(raw, ",")
	ids := make([]string, 0, len(parts))
	for _, part := range parts {
		id := strings.TrimSpace(part)
		if id != "" {
			ids = append(ids, id)
		}
	}

	return ids
}

func normalizePagination(page int, limit int) (int, int) {
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	return page, limit
}

func resumeResponse(store *store.Store, resume *models.Resume) views.ResumeResponse {
	return views.Resume(resume, store.SkillsByIDs(resume.SkillIDs))
}

func vacancyResponse(store *store.Store, vacancy *models.Vacancy) views.VacancyResponse {
	return views.Vacancy(
		vacancy,
		store.CompanyByID(vacancy.CompanyID),
		store.IndustryByID(vacancy.IndustryID),
		store.SkillsByIDs(vacancy.SkillIDs),
	)
}
