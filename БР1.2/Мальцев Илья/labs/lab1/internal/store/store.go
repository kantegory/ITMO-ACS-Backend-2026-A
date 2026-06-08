package store

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"sort"
	"strings"
	"sync"
	"time"

	"job-search-api/internal/errs"
	"job-search-api/internal/models"
)

type Store struct {
	mu sync.RWMutex

	users        map[string]*models.User
	usersByEmail map[string]string
	tokens       map[string]string

	skills       map[string]*models.Skill
	industries   map[string]*models.Industry
	companies    map[string]*models.Company
	resumes      map[string]*models.Resume
	vacancies    map[string]*models.Vacancy
	applications map[string]*models.Application
}

type RegisterInput struct {
	Email       string
	Password    string
	Role        models.UserRole
	FirstName   string
	LastName    string
	CompanyName string
}

type LoginInput struct {
	Email    string
	Password string
}

type VacancyFilter struct {
	Search          string
	IndustryID      string
	SkillIDs        []string
	SalaryFrom      *int
	ExperienceLevel models.ExperienceLevel
	Page            int
	Limit           int
}

type CreateResumeInput struct {
	Title           string
	ExperienceYears int
	Education       string
	WorkExperience  string
	ExpectedSalary  *int
	SkillIDs        []string
}

type CreateVacancyInput struct {
	IndustryID      string
	Title           string
	Description     string
	Requirements    string
	SalaryFrom      *int
	SalaryTo        *int
	ExperienceLevel models.ExperienceLevel
	EmploymentType  models.EmploymentType
	City            string
	Status          models.VacancyStatus
	SkillIDs        []string
}

func New() *Store {
	store := &Store{
		users:        make(map[string]*models.User),
		usersByEmail: make(map[string]string),
		tokens:       make(map[string]string),
		skills:       make(map[string]*models.Skill),
		industries:   make(map[string]*models.Industry),
		companies:    make(map[string]*models.Company),
		resumes:      make(map[string]*models.Resume),
		vacancies:    make(map[string]*models.Vacancy),
		applications: make(map[string]*models.Application),
	}

	store.seed()

	return store
}

func (store *Store) Register(input RegisterInput) (*models.User, string, error) {
	store.mu.Lock()
	defer store.mu.Unlock()

	email := normalizeEmail(input.Email)
	if email == "" || !strings.Contains(email, "@") {
		return nil, "", errs.BadRequest("valid email is required")
	}

	if len(input.Password) < 8 {
		return nil, "", errs.BadRequest("password must contain at least 8 characters")
	}

	if !input.Role.Valid() {
		return nil, "", errs.BadRequest("role must be applicant or employer")
	}

	if _, exists := store.usersByEmail[email]; exists {
		return nil, "", errs.Conflict("user with this email already exists")
	}

	user := &models.User{
		ID:           newID(),
		Email:        email,
		PasswordHash: hashPassword(input.Password),
		Role:         input.Role,
		FirstName:    strings.TrimSpace(input.FirstName),
		LastName:     strings.TrimSpace(input.LastName),
	}

	if input.Role == models.RoleEmployer {
		companyName := strings.TrimSpace(input.CompanyName)
		if companyName == "" {
			companyName = "Company " + email
		}

		company := &models.Company{
			ID:          newID(),
			Name:        companyName,
			Description: "Company profile created during employer registration",
			City:        "Saint Petersburg",
		}
		store.companies[company.ID] = company
		user.CompanyID = company.ID
	}

	store.users[user.ID] = user
	store.usersByEmail[email] = user.ID

	token := store.issueTokenLocked(user.ID)
	return copyUser(user), token, nil
}

func (store *Store) Login(input LoginInput) (*models.User, string, error) {
	store.mu.Lock()
	defer store.mu.Unlock()

	email := normalizeEmail(input.Email)
	userID, exists := store.usersByEmail[email]
	if !exists {
		return nil, "", errs.Unauthorized("invalid email or password")
	}

	user := store.users[userID]
	if user.PasswordHash != hashPassword(input.Password) {
		return nil, "", errs.Unauthorized("invalid email or password")
	}

	token := store.issueTokenLocked(user.ID)
	return copyUser(user), token, nil
}

func (store *Store) Authenticate(token string) (*models.User, error) {
	store.mu.RLock()
	defer store.mu.RUnlock()

	userID, exists := store.tokens[strings.TrimSpace(token)]
	if !exists {
		return nil, errs.Unauthorized("invalid or expired access token")
	}

	user, exists := store.users[userID]
	if !exists {
		return nil, errs.Unauthorized("invalid or expired access token")
	}

	return copyUser(user), nil
}

func (store *Store) ListSkills() []models.Skill {
	store.mu.RLock()
	defer store.mu.RUnlock()

	skills := make([]models.Skill, 0, len(store.skills))
	for _, skill := range store.skills {
		skills = append(skills, *skill)
	}
	sort.Slice(skills, func(left, right int) bool {
		return skills[left].Name < skills[right].Name
	})

	return skills
}

func (store *Store) ListIndustries() []models.Industry {
	store.mu.RLock()
	defer store.mu.RUnlock()

	industries := make([]models.Industry, 0, len(store.industries))
	for _, industry := range store.industries {
		industries = append(industries, *industry)
	}
	sort.Slice(industries, func(left, right int) bool {
		return industries[left].Name < industries[right].Name
	})

	return industries
}

func (store *Store) SearchVacancies(filter VacancyFilter) ([]*models.Vacancy, int) {
	store.mu.RLock()
	defer store.mu.RUnlock()

	page, limit := normalizePagination(filter.Page, filter.Limit)
	matches := make([]*models.Vacancy, 0)

	for _, vacancy := range store.vacancies {
		if vacancy.Status != models.VacancyPublished {
			continue
		}
		if !matchesVacancyFilter(vacancy, filter) {
			continue
		}

		matches = append(matches, copyVacancy(vacancy))
	}

	sort.Slice(matches, func(left, right int) bool {
		return matches[left].CreatedAt.After(matches[right].CreatedAt)
	})

	total := len(matches)
	start := (page - 1) * limit
	if start >= total {
		return []*models.Vacancy{}, total
	}

	end := min(start+limit, total)
	return matches[start:end], total
}

func (store *Store) PublicVacancyByID(id string) (*models.Vacancy, error) {
	store.mu.RLock()
	defer store.mu.RUnlock()

	vacancy, exists := store.vacancies[id]
	if !exists || vacancy.Status != models.VacancyPublished {
		return nil, errs.NotFound("vacancy not found")
	}

	return copyVacancy(vacancy), nil
}

func (store *Store) CreateResume(user *models.User, input CreateResumeInput) (*models.Resume, error) {
	store.mu.Lock()
	defer store.mu.Unlock()

	if user.Role != models.RoleApplicant {
		return nil, errs.Forbidden("only applicants can manage resumes")
	}

	if err := validateResumeInput(input); err != nil {
		return nil, err
	}

	if err := store.validateSkillIDsLocked(input.SkillIDs); err != nil {
		return nil, err
	}

	resume := &models.Resume{
		ID:              newID(),
		ApplicantID:     user.ID,
		Title:           strings.TrimSpace(input.Title),
		ExperienceYears: input.ExperienceYears,
		Education:       strings.TrimSpace(input.Education),
		WorkExperience:  strings.TrimSpace(input.WorkExperience),
		ExpectedSalary:  copyIntPointer(input.ExpectedSalary),
		SkillIDs:        copyStringSlice(input.SkillIDs),
	}

	store.resumes[resume.ID] = resume
	return copyResume(resume), nil
}

func (store *Store) ApplicantResumes(user *models.User) ([]*models.Resume, error) {
	store.mu.RLock()
	defer store.mu.RUnlock()

	if user.Role != models.RoleApplicant {
		return nil, errs.Forbidden("only applicants can view applicant resumes")
	}

	resumes := make([]*models.Resume, 0)
	for _, resume := range store.resumes {
		if resume.ApplicantID == user.ID {
			resumes = append(resumes, copyResume(resume))
		}
	}

	sort.Slice(resumes, func(left, right int) bool {
		return resumes[left].Title < resumes[right].Title
	})

	return resumes, nil
}

func (store *Store) CreateApplication(user *models.User, vacancyID string, resumeID string, coverLetter string) (*models.Application, error) {
	store.mu.Lock()
	defer store.mu.Unlock()

	if user.Role != models.RoleApplicant {
		return nil, errs.Forbidden("only applicants can apply to vacancies")
	}

	vacancy, exists := store.vacancies[vacancyID]
	if !exists || vacancy.Status != models.VacancyPublished {
		return nil, errs.NotFound("vacancy not found")
	}

	resume, exists := store.resumes[resumeID]
	if !exists || resume.ApplicantID != user.ID {
		return nil, errs.NotFound("resume not found")
	}

	for _, application := range store.applications {
		if application.ApplicantID == user.ID && application.VacancyID == vacancyID && application.Status != models.ApplicationWithdrawn {
			return nil, errs.Conflict("application for this vacancy already exists")
		}
	}

	application := &models.Application{
		ID:          newID(),
		VacancyID:   vacancy.ID,
		ApplicantID: user.ID,
		ResumeID:    resume.ID,
		Status:      models.ApplicationSubmitted,
		CoverLetter: strings.TrimSpace(coverLetter),
		CreatedAt:   time.Now().UTC(),
	}

	store.applications[application.ID] = application
	return copyApplication(application), nil
}

func (store *Store) ApplicantApplications(user *models.User) ([]*models.Application, error) {
	store.mu.RLock()
	defer store.mu.RUnlock()

	if user.Role != models.RoleApplicant {
		return nil, errs.Forbidden("only applicants can view applicant applications")
	}

	applications := make([]*models.Application, 0)
	for _, application := range store.applications {
		if application.ApplicantID == user.ID {
			applications = append(applications, copyApplication(application))
		}
	}

	sort.Slice(applications, func(left, right int) bool {
		return applications[left].CreatedAt.After(applications[right].CreatedAt)
	})

	return applications, nil
}

func (store *Store) EmployerVacancies(user *models.User) ([]*models.Vacancy, error) {
	store.mu.RLock()
	defer store.mu.RUnlock()

	if user.Role != models.RoleEmployer {
		return nil, errs.Forbidden("only employers can view employer vacancies")
	}

	vacancies := make([]*models.Vacancy, 0)
	for _, vacancy := range store.vacancies {
		if vacancy.EmployerID == user.ID {
			vacancies = append(vacancies, copyVacancy(vacancy))
		}
	}

	sort.Slice(vacancies, func(left, right int) bool {
		return vacancies[left].CreatedAt.After(vacancies[right].CreatedAt)
	})

	return vacancies, nil
}

func (store *Store) CreateVacancy(user *models.User, input CreateVacancyInput) (*models.Vacancy, error) {
	store.mu.Lock()
	defer store.mu.Unlock()

	if user.Role != models.RoleEmployer {
		return nil, errs.Forbidden("only employers can manage vacancies")
	}

	if err := store.validateVacancyInputLocked(input); err != nil {
		return nil, err
	}

	status := input.Status
	if status == "" {
		status = models.VacancyPublished
	}

	vacancy := &models.Vacancy{
		ID:              newID(),
		CompanyID:       user.CompanyID,
		EmployerID:      user.ID,
		IndustryID:      input.IndustryID,
		Title:           strings.TrimSpace(input.Title),
		Description:     strings.TrimSpace(input.Description),
		Requirements:    strings.TrimSpace(input.Requirements),
		SalaryFrom:      copyIntPointer(input.SalaryFrom),
		SalaryTo:        copyIntPointer(input.SalaryTo),
		ExperienceLevel: input.ExperienceLevel,
		EmploymentType:  input.EmploymentType,
		City:            strings.TrimSpace(input.City),
		Status:          status,
		SkillIDs:        copyStringSlice(input.SkillIDs),
		CreatedAt:       time.Now().UTC(),
	}

	store.vacancies[vacancy.ID] = vacancy
	return copyVacancy(vacancy), nil
}

func (store *Store) UpdateVacancy(user *models.User, vacancyID string, input CreateVacancyInput) (*models.Vacancy, error) {
	store.mu.Lock()
	defer store.mu.Unlock()

	if user.Role != models.RoleEmployer {
		return nil, errs.Forbidden("only employers can manage vacancies")
	}

	vacancy, exists := store.vacancies[vacancyID]
	if !exists {
		return nil, errs.NotFound("vacancy not found")
	}

	if vacancy.EmployerID != user.ID {
		return nil, errs.Forbidden("vacancy belongs to another employer")
	}

	if err := store.validateVacancyInputLocked(input); err != nil {
		return nil, err
	}

	status := input.Status
	if status == "" {
		status = vacancy.Status
	}

	vacancy.IndustryID = input.IndustryID
	vacancy.Title = strings.TrimSpace(input.Title)
	vacancy.Description = strings.TrimSpace(input.Description)
	vacancy.Requirements = strings.TrimSpace(input.Requirements)
	vacancy.SalaryFrom = copyIntPointer(input.SalaryFrom)
	vacancy.SalaryTo = copyIntPointer(input.SalaryTo)
	vacancy.ExperienceLevel = input.ExperienceLevel
	vacancy.EmploymentType = input.EmploymentType
	vacancy.City = strings.TrimSpace(input.City)
	vacancy.Status = status
	vacancy.SkillIDs = copyStringSlice(input.SkillIDs)

	return copyVacancy(vacancy), nil
}

func (store *Store) CloseVacancy(user *models.User, vacancyID string) error {
	store.mu.Lock()
	defer store.mu.Unlock()

	if user.Role != models.RoleEmployer {
		return errs.Forbidden("only employers can manage vacancies")
	}

	vacancy, exists := store.vacancies[vacancyID]
	if !exists {
		return errs.NotFound("vacancy not found")
	}

	if vacancy.EmployerID != user.ID {
		return errs.Forbidden("vacancy belongs to another employer")
	}

	vacancy.Status = models.VacancyClosed
	return nil
}

func (store *Store) UpdateApplicationStatus(user *models.User, applicationID string, status models.ApplicationStatus) (*models.Application, error) {
	store.mu.Lock()
	defer store.mu.Unlock()

	if user.Role != models.RoleEmployer {
		return nil, errs.Forbidden("only employers can update application statuses")
	}

	if !status.Valid() {
		return nil, errs.BadRequest("invalid application status")
	}

	application, exists := store.applications[applicationID]
	if !exists {
		return nil, errs.NotFound("application not found")
	}

	vacancy, exists := store.vacancies[application.VacancyID]
	if !exists {
		return nil, errs.NotFound("vacancy not found")
	}

	if vacancy.EmployerID != user.ID {
		return nil, errs.Forbidden("application belongs to another employer")
	}

	application.Status = status
	return copyApplication(application), nil
}

func (store *Store) CompanyByID(id string) *models.Company {
	store.mu.RLock()
	defer store.mu.RUnlock()

	company, exists := store.companies[id]
	if !exists {
		return nil
	}

	return copyCompany(company)
}

func (store *Store) IndustryByID(id string) *models.Industry {
	store.mu.RLock()
	defer store.mu.RUnlock()

	industry, exists := store.industries[id]
	if !exists {
		return nil
	}

	return copyIndustry(industry)
}

func (store *Store) SkillsByIDs(ids []string) []models.Skill {
	store.mu.RLock()
	defer store.mu.RUnlock()

	return store.skillsByIDsLocked(ids)
}

func (store *Store) seed() {
	skills := []*models.Skill{
		{ID: "11111111-1111-4111-8111-111111111111", Name: "Go"},
		{ID: "22222222-2222-4222-8222-222222222222", Name: "TypeScript"},
		{ID: "33333333-3333-4333-8333-333333333333", Name: "PostgreSQL"},
		{ID: "44444444-4444-4444-8444-444444444444", Name: "Docker"},
	}
	for _, skill := range skills {
		store.skills[skill.ID] = skill
	}

	industries := []*models.Industry{
		{ID: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", Name: "Information Technology"},
		{ID: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", Name: "Finance"},
		{ID: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", Name: "Education"},
	}
	for _, industry := range industries {
		store.industries[industry.ID] = industry
	}

	company := &models.Company{
		ID:          "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
		Name:        "TechNova",
		Description: "Product company building cloud services for job matching.",
		Website:     "https://technova.example",
		City:        "Saint Petersburg",
	}
	store.companies[company.ID] = company

	applicant := &models.User{
		ID:           "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
		Email:        "applicant@example.com",
		PasswordHash: hashPassword("password123"),
		Role:         models.RoleApplicant,
		FirstName:    "Ilya",
		LastName:     "Maltsev",
	}
	store.users[applicant.ID] = applicant
	store.usersByEmail[applicant.Email] = applicant.ID

	employer := &models.User{
		ID:           "ffffffff-ffff-4fff-8fff-ffffffffffff",
		Email:        "employer@example.com",
		PasswordHash: hashPassword("password123"),
		Role:         models.RoleEmployer,
		CompanyID:    company.ID,
	}
	store.users[employer.ID] = employer
	store.usersByEmail[employer.Email] = employer.ID

	expectedSalary := 180000
	resume := &models.Resume{
		ID:              "99999999-9999-4999-8999-999999999999",
		ApplicantID:     applicant.ID,
		Title:           "Backend Developer",
		ExperienceYears: 2,
		Education:       "ITMO University",
		WorkExperience:  "Built REST APIs and internal services.",
		ExpectedSalary:  &expectedSalary,
		SkillIDs:        []string{skills[0].ID, skills[2].ID, skills[3].ID},
	}
	store.resumes[resume.ID] = resume

	salaryFrom := 160000
	salaryTo := 260000
	vacancy := &models.Vacancy{
		ID:              "88888888-8888-4888-8888-888888888888",
		CompanyID:       company.ID,
		EmployerID:      employer.ID,
		IndustryID:      industries[0].ID,
		Title:           "Go Backend Developer",
		Description:     "Develop REST API for job search services.",
		Requirements:    "Go, PostgreSQL, Docker, REST API design.",
		SalaryFrom:      &salaryFrom,
		SalaryTo:        &salaryTo,
		ExperienceLevel: models.ExperienceMiddle,
		EmploymentType:  models.EmploymentHybrid,
		City:            "Saint Petersburg",
		Status:          models.VacancyPublished,
		SkillIDs:        []string{skills[0].ID, skills[2].ID, skills[3].ID},
		CreatedAt:       time.Now().UTC().Add(-time.Hour),
	}
	store.vacancies[vacancy.ID] = vacancy
}

func (store *Store) issueTokenLocked(userID string) string {
	token := newID() + "." + newID()
	store.tokens[token] = userID
	return token
}

func (store *Store) validateSkillIDsLocked(ids []string) error {
	if len(ids) == 0 {
		return errs.BadRequest("at least one skill_id is required")
	}

	for _, id := range ids {
		if _, exists := store.skills[id]; !exists {
			return errs.BadRequest("unknown skill_id: " + id)
		}
	}

	return nil
}

func (store *Store) validateVacancyInputLocked(input CreateVacancyInput) error {
	if strings.TrimSpace(input.Title) == "" {
		return errs.BadRequest("title is required")
	}
	if strings.TrimSpace(input.Description) == "" {
		return errs.BadRequest("description is required")
	}
	if strings.TrimSpace(input.Requirements) == "" {
		return errs.BadRequest("requirements are required")
	}
	if _, exists := store.industries[input.IndustryID]; !exists {
		return errs.BadRequest("unknown industry_id")
	}
	if !input.ExperienceLevel.Valid() {
		return errs.BadRequest("invalid experience_level")
	}
	if !input.EmploymentType.Valid() {
		return errs.BadRequest("invalid employment_type")
	}
	if input.Status != "" && !input.Status.Valid() {
		return errs.BadRequest("invalid vacancy status")
	}
	if err := store.validateSkillIDsLocked(input.SkillIDs); err != nil {
		return err
	}
	if input.SalaryFrom != nil && *input.SalaryFrom < 0 {
		return errs.BadRequest("salary_from must be positive")
	}
	if input.SalaryTo != nil && *input.SalaryTo < 0 {
		return errs.BadRequest("salary_to must be positive")
	}
	if input.SalaryFrom != nil && input.SalaryTo != nil && *input.SalaryTo < *input.SalaryFrom {
		return errs.BadRequest("salary_to must be greater than salary_from")
	}

	return nil
}

func (store *Store) skillsByIDsLocked(ids []string) []models.Skill {
	skills := make([]models.Skill, 0, len(ids))
	for _, id := range ids {
		if skill, exists := store.skills[id]; exists {
			skills = append(skills, *skill)
		}
	}

	return skills
}

func validateResumeInput(input CreateResumeInput) error {
	if strings.TrimSpace(input.Title) == "" {
		return errs.BadRequest("title is required")
	}
	if input.ExperienceYears < 0 {
		return errs.BadRequest("experience_years must be positive")
	}
	if input.ExpectedSalary != nil && *input.ExpectedSalary < 0 {
		return errs.BadRequest("expected_salary must be positive")
	}

	return nil
}

func matchesVacancyFilter(vacancy *models.Vacancy, filter VacancyFilter) bool {
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

func containsAll(values []string, required []string) bool {
	lookup := make(map[string]struct{}, len(values))
	for _, value := range values {
		lookup[value] = struct{}{}
	}

	for _, value := range required {
		if _, exists := lookup[value]; !exists {
			return false
		}
	}

	return true
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

func hashPassword(password string) string {
	hash := sha256.Sum256([]byte("job-search-api:" + password))
	return hex.EncodeToString(hash[:])
}

func newID() string {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return fmt.Sprintf("00000000-0000-4000-8000-%012x", time.Now().UnixNano())
	}

	bytes[6] = (bytes[6] & 0x0f) | 0x40
	bytes[8] = (bytes[8] & 0x3f) | 0x80

	return fmt.Sprintf("%x-%x-%x-%x-%x", bytes[0:4], bytes[4:6], bytes[6:8], bytes[8:10], bytes[10:16])
}

func copyUser(user *models.User) *models.User {
	if user == nil {
		return nil
	}

	copied := *user
	return &copied
}

func copyCompany(company *models.Company) *models.Company {
	if company == nil {
		return nil
	}

	copied := *company
	return &copied
}

func copyIndustry(industry *models.Industry) *models.Industry {
	if industry == nil {
		return nil
	}

	copied := *industry
	return &copied
}

func copyResume(resume *models.Resume) *models.Resume {
	if resume == nil {
		return nil
	}

	copied := *resume
	copied.SkillIDs = copyStringSlice(resume.SkillIDs)
	copied.ExpectedSalary = copyIntPointer(resume.ExpectedSalary)
	return &copied
}

func copyVacancy(vacancy *models.Vacancy) *models.Vacancy {
	if vacancy == nil {
		return nil
	}

	copied := *vacancy
	copied.SkillIDs = copyStringSlice(vacancy.SkillIDs)
	copied.SalaryFrom = copyIntPointer(vacancy.SalaryFrom)
	copied.SalaryTo = copyIntPointer(vacancy.SalaryTo)
	return &copied
}

func copyApplication(application *models.Application) *models.Application {
	if application == nil {
		return nil
	}

	copied := *application
	return &copied
}

func copyStringSlice(values []string) []string {
	if values == nil {
		return nil
	}

	copied := make([]string, len(values))
	copy(copied, values)
	return copied
}

func copyIntPointer(value *int) *int {
	if value == nil {
		return nil
	}

	copied := *value
	return &copied
}
