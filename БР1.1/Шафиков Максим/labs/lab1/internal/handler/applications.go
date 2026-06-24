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

type ApplicationsHandler struct {
	repos *repository.Repositories
}

type applyRequest struct {
	ResumeID    uuid.UUID `json:"resume_id" binding:"required"`
	CoverLetter *string   `json:"cover_letter"`
}

type applicationStatusPatchRequest struct {
	Status model.ApplicationStatus `json:"status" binding:"required,oneof=pending accepted rejected"`
}

func (h *ApplicationsHandler) Apply(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		errorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}
	role, _ := middleware.GetUserRole(c)
	if role != string(model.RoleCandidate) {
		errorResponse(c, http.StatusForbidden, "FORBIDDEN", "Only candidates can apply to vacancies")
		return
	}

	vacancyID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		errorResponse(c, http.StatusBadRequest, "INVALID_ID", "Invalid vacancy ID")
		return
	}

	vacancy, err := h.repos.Vacancies.GetByID(c.Request.Context(), vacancyID)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to get vacancy")
		return
	}
	if vacancy == nil {
		errorResponse(c, http.StatusNotFound, "NOT_FOUND", "Vacancy not found")
		return
	}

	existing, err := h.repos.Applications.GetByVacancyAndCandidate(c.Request.Context(), vacancyID, userID)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to check application")
		return
	}
	if existing != nil {
		errorResponse(c, http.StatusConflict, "ALREADY_APPLIED", "You have already applied to this vacancy")
		return
	}

	var req applyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		errorResponse(c, http.StatusBadRequest, "VALIDATION_ERROR", err.Error())
		return
	}

	application, err := h.repos.Applications.Create(c.Request.Context(), vacancyID, userID, req.ResumeID, req.CoverLetter)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to create application")
		return
	}

	c.JSON(http.StatusCreated, application)
}

func (h *ApplicationsHandler) List(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		errorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}
	role, _ := middleware.GetUserRole(c)

	filter := repository.AppFilter{
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
	if v := c.Query("vacancy_id"); v != "" {
		if id, err := uuid.Parse(v); err == nil {
			filter.VacancyID = &id
		}
	}
	if v := c.Query("status"); v != "" {
		s := model.ApplicationStatus(v)
		filter.Status = &s
	}

	var (
		applications []model.Application
		total        int
		listErr      error
	)

	if role == string(model.RoleCandidate) {
		applications, total, listErr = h.repos.Applications.ListByCandidate(c.Request.Context(), userID, filter)
	} else {
		company, err := h.repos.Companies.GetByUserID(c.Request.Context(), userID)
		if err != nil {
			errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to get company")
			return
		}
		if company == nil {
			errorResponse(c, http.StatusForbidden, "NO_COMPANY", "You must create a company profile first")
			return
		}
		applications, total, listErr = h.repos.Applications.ListByCompany(c.Request.Context(), company.ID, filter)
	}

	if listErr != nil {
		errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to list applications")
		return
	}

	totalPages := int(math.Ceil(float64(total) / float64(filter.PerPage)))
	if totalPages < 1 {
		totalPages = 1
	}

	c.JSON(http.StatusOK, gin.H{
		"data": applications,
		"meta": model.PaginationMeta{
			Total:      total,
			Page:       filter.Page,
			PerPage:    filter.PerPage,
			TotalPages: totalPages,
		},
	})
}

func (h *ApplicationsHandler) GetByID(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		errorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}
	role, _ := middleware.GetUserRole(c)

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		errorResponse(c, http.StatusBadRequest, "INVALID_ID", "Invalid application ID")
		return
	}

	app, err := h.repos.Applications.GetByID(c.Request.Context(), id)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to get application")
		return
	}
	if app == nil {
		errorResponse(c, http.StatusNotFound, "NOT_FOUND", "Application not found")
		return
	}

	// Check access: candidate is owner, or employer owns the vacancy's company
	if role == string(model.RoleCandidate) {
		if app.CandidateID != userID {
			errorResponse(c, http.StatusForbidden, "FORBIDDEN", "Access denied")
			return
		}
	} else {
		company, err := h.repos.Companies.GetByUserID(c.Request.Context(), userID)
		if err != nil || company == nil {
			errorResponse(c, http.StatusForbidden, "FORBIDDEN", "Access denied")
			return
		}
		if app.Vacancy == nil || app.Vacancy.CompanyID != company.ID {
			errorResponse(c, http.StatusForbidden, "FORBIDDEN", "Access denied")
			return
		}
	}

	c.JSON(http.StatusOK, app)
}

func (h *ApplicationsHandler) UpdateStatus(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		errorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}
	role, _ := middleware.GetUserRole(c)
	if role != string(model.RoleEmployer) {
		errorResponse(c, http.StatusForbidden, "FORBIDDEN", "Only employers can update application status")
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		errorResponse(c, http.StatusBadRequest, "INVALID_ID", "Invalid application ID")
		return
	}

	app, err := h.repos.Applications.GetByID(c.Request.Context(), id)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to get application")
		return
	}
	if app == nil {
		errorResponse(c, http.StatusNotFound, "NOT_FOUND", "Application not found")
		return
	}

	company, err := h.repos.Companies.GetByUserID(c.Request.Context(), userID)
	if err != nil || company == nil {
		errorResponse(c, http.StatusForbidden, "FORBIDDEN", "No company profile")
		return
	}
	if app.Vacancy == nil || app.Vacancy.CompanyID != company.ID {
		errorResponse(c, http.StatusForbidden, "FORBIDDEN", "You don't own this vacancy")
		return
	}

	var req applicationStatusPatchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		errorResponse(c, http.StatusBadRequest, "VALIDATION_ERROR", err.Error())
		return
	}

	updated, err := h.repos.Applications.UpdateStatus(c.Request.Context(), id, req.Status)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to update application")
		return
	}

	c.JSON(http.StatusOK, updated)
}

func (h *ApplicationsHandler) Delete(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		errorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}
	role, _ := middleware.GetUserRole(c)
	if role != string(model.RoleCandidate) {
		errorResponse(c, http.StatusForbidden, "FORBIDDEN", "Only candidates can withdraw applications")
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		errorResponse(c, http.StatusBadRequest, "INVALID_ID", "Invalid application ID")
		return
	}

	app, err := h.repos.Applications.GetByID(c.Request.Context(), id)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to get application")
		return
	}
	if app == nil {
		errorResponse(c, http.StatusNotFound, "NOT_FOUND", "Application not found")
		return
	}
	if app.CandidateID != userID {
		errorResponse(c, http.StatusForbidden, "FORBIDDEN", "You don't own this application")
		return
	}
	if app.Status != model.AppPending {
		errorResponse(c, http.StatusConflict, "CANNOT_WITHDRAW", "Only pending applications can be withdrawn")
		return
	}

	if err := h.repos.Applications.Delete(c.Request.Context(), id); err != nil {
		errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to delete application")
		return
	}

	c.Status(http.StatusNoContent)
}
