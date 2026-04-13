package handler

import (
	"math"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"job-search/internal/middleware"
	"job-search/internal/model"
	"job-search/internal/repository"
)

type VacanciesHandler struct {
	repos *repository.Repositories
}

type vacancyCreateRequest struct {
	Title           string                  `json:"title" binding:"required"`
	Description     *string                 `json:"description"`
	IndustryID      *uuid.UUID              `json:"industry_id"`
	CurrencyCode    string                  `json:"currency_code"`
	SalaryMin       *int                    `json:"salary_min"`
	SalaryMax       *int                    `json:"salary_max"`
	ExperienceLevel *model.ExperienceLevel  `json:"experience_level"`
	Format          model.WorkFormat        `json:"format"`
	Status          model.VacancyStatus     `json:"status"`
	SkillIDs        []uuid.UUID             `json:"skill_ids"`
}

type vacancyPatchRequest struct {
	Title           *string                 `json:"title"`
	Description     *string                 `json:"description"`
	IndustryID      *uuid.UUID              `json:"industry_id"`
	CurrencyCode    *string                 `json:"currency_code"`
	SalaryMin       *int                    `json:"salary_min"`
	SalaryMax       *int                    `json:"salary_max"`
	ExperienceLevel *model.ExperienceLevel  `json:"experience_level"`
	Format          *model.WorkFormat       `json:"format"`
	Status          *model.VacancyStatus    `json:"status"`
	SkillIDs        []uuid.UUID             `json:"skill_ids"`
}

func (h *VacanciesHandler) List(c *gin.Context) {
	filter := repository.VacancyFilter{
		Page:    1,
		PerPage: 20,
	}

	if v := c.Query("page"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			filter.Page = n
		}
	}
	if v := c.Query("per_page"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			if n > 100 {
				n = 100
			}
			filter.PerPage = n
		}
	}

	if v := c.Query("industry"); v != "" {
		if id, err := uuid.Parse(v); err == nil {
			filter.Industry = &id
		}
	}
	if v := c.Query("company_id"); v != "" {
		if id, err := uuid.Parse(v); err == nil {
			filter.CompanyID = &id
		}
	}
	if v := c.Query("min_salary"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			filter.MinSalary = &n
		}
	}
	if v := c.Query("max_salary"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			filter.MaxSalary = &n
		}
	}
	if v := c.Query("experience_level"); v != "" {
		el := model.ExperienceLevel(v)
		filter.ExperienceLevel = &el
	}
	if v := c.Query("format"); v != "" {
		wf := model.WorkFormat(v)
		filter.Format = &wf
	}
	if v := c.Query("status"); v != "" {
		vs := model.VacancyStatus(v)
		filter.Status = &vs
	}
	filter.SearchQuery = c.Query("search_query")

	vacancies, total, err := h.repos.Vacancies.List(c.Request.Context(), filter)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to list vacancies")
		return
	}

	totalPages := int(math.Ceil(float64(total) / float64(filter.PerPage)))
	if totalPages < 1 {
		totalPages = 1
	}

	c.JSON(http.StatusOK, gin.H{
		"data": vacancies,
		"meta": model.PaginationMeta{
			Total:      total,
			Page:       filter.Page,
			PerPage:    filter.PerPage,
			TotalPages: totalPages,
		},
	})
}

func (h *VacanciesHandler) Create(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		errorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}
	role, _ := middleware.GetUserRole(c)
	if role != string(model.RoleEmployer) {
		errorResponse(c, http.StatusForbidden, "FORBIDDEN", "Only employers can create vacancies")
		return
	}

	company, err := h.repos.Companies.GetByUserID(c.Request.Context(), userID)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to get company")
		return
	}
	if company == nil {
		errorResponse(c, http.StatusForbidden, "NO_COMPANY", "You must create a company profile first")
		return
	}

	var req vacancyCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		errorResponse(c, http.StatusBadRequest, "VALIDATION_ERROR", err.Error())
		return
	}

	vacancy, err := h.repos.Vacancies.Create(c.Request.Context(), company.ID, repository.VacancyCreateRequest{
		Title:           req.Title,
		Description:     req.Description,
		IndustryID:      req.IndustryID,
		CurrencyCode:    req.CurrencyCode,
		SalaryMin:       req.SalaryMin,
		SalaryMax:       req.SalaryMax,
		ExperienceLevel: req.ExperienceLevel,
		Format:          req.Format,
		Status:          req.Status,
		SkillIDs:        req.SkillIDs,
	})
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to create vacancy")
		return
	}

	c.JSON(http.StatusCreated, vacancy)
}

func (h *VacanciesHandler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		errorResponse(c, http.StatusBadRequest, "INVALID_ID", "Invalid vacancy ID")
		return
	}

	vacancy, err := h.repos.Vacancies.GetByID(c.Request.Context(), id)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to get vacancy")
		return
	}
	if vacancy == nil {
		errorResponse(c, http.StatusNotFound, "NOT_FOUND", "Vacancy not found")
		return
	}

	c.JSON(http.StatusOK, vacancy)
}

func (h *VacanciesHandler) Update(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		errorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		errorResponse(c, http.StatusBadRequest, "INVALID_ID", "Invalid vacancy ID")
		return
	}

	companyID, err := h.repos.Vacancies.GetCompanyIDByVacancyID(c.Request.Context(), id)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to get vacancy")
		return
	}
	if companyID == uuid.Nil {
		errorResponse(c, http.StatusNotFound, "NOT_FOUND", "Vacancy not found")
		return
	}

	company, err := h.repos.Companies.GetByUserID(c.Request.Context(), userID)
	if err != nil || company == nil || company.ID != companyID {
		errorResponse(c, http.StatusForbidden, "FORBIDDEN", "You don't own this vacancy")
		return
	}

	var req vacancyPatchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		errorResponse(c, http.StatusBadRequest, "VALIDATION_ERROR", err.Error())
		return
	}

	updateReq := repository.VacancyUpdateRequest{
		Title:           req.Title,
		Description:     req.Description,
		IndustryID:      req.IndustryID,
		CurrencyCode:    req.CurrencyCode,
		SalaryMin:       req.SalaryMin,
		SalaryMax:       req.SalaryMax,
		ExperienceLevel: req.ExperienceLevel,
		Format:          req.Format,
		Status:          req.Status,
		SkillIDsSet:     req.SkillIDs != nil,
		SkillIDs:        req.SkillIDs,
	}

	vacancy, err := h.repos.Vacancies.Update(c.Request.Context(), id, updateReq)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to update vacancy")
		return
	}
	if vacancy == nil {
		errorResponse(c, http.StatusNotFound, "NOT_FOUND", "Vacancy not found")
		return
	}

	c.JSON(http.StatusOK, vacancy)
}

func (h *VacanciesHandler) Delete(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		errorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		errorResponse(c, http.StatusBadRequest, "INVALID_ID", "Invalid vacancy ID")
		return
	}

	companyID, err := h.repos.Vacancies.GetCompanyIDByVacancyID(c.Request.Context(), id)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to get vacancy")
		return
	}
	if companyID == uuid.Nil {
		errorResponse(c, http.StatusNotFound, "NOT_FOUND", "Vacancy not found")
		return
	}

	company, err := h.repos.Companies.GetByUserID(c.Request.Context(), userID)
	if err != nil || company == nil || company.ID != companyID {
		errorResponse(c, http.StatusForbidden, "FORBIDDEN", "You don't own this vacancy")
		return
	}

	if err := h.repos.Vacancies.Delete(c.Request.Context(), id); err != nil {
		errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to delete vacancy")
		return
	}

	c.Status(http.StatusNoContent)
}
