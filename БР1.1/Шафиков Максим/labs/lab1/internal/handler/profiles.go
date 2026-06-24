package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"job-search/internal/middleware"
	"job-search/internal/model"
	"job-search/internal/repository"
)

type ProfilesHandler struct {
	repos *repository.Repositories
}

type companyUpsertRequest struct {
	Name        string     `json:"name" binding:"required"`
	Description *string    `json:"description"`
	Location    *string    `json:"location"`
	IndustryID  *uuid.UUID `json:"industry_id"`
}

type profileMeResponse struct {
	User    *model.User     `json:"user"`
	Resumes []model.Resume  `json:"resumes,omitempty"`
	Company *model.Company  `json:"company,omitempty"`
}

func (h *ProfilesHandler) GetMe(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		errorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}
	role, _ := middleware.GetUserRole(c)

	user, err := h.repos.Users.GetByID(c.Request.Context(), userID)
	if err != nil || user == nil {
		errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to get user")
		return
	}

	resp := profileMeResponse{User: user}

	if role == string(model.RoleCandidate) {
		resumes, err := h.repos.Resumes.ListByUserID(c.Request.Context(), userID)
		if err != nil {
			errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to get resumes")
			return
		}
		resp.Resumes = resumes
	} else {
		company, err := h.repos.Companies.GetByUserID(c.Request.Context(), userID)
		if err != nil {
			errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to get company")
			return
		}
		resp.Company = company
	}

	c.JSON(http.StatusOK, resp)
}

func (h *ProfilesHandler) UpsertCompany(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		errorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}
	role, _ := middleware.GetUserRole(c)
	if role != string(model.RoleEmployer) {
		errorResponse(c, http.StatusForbidden, "FORBIDDEN", "Only employers can manage company profiles")
		return
	}

	var req companyUpsertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		errorResponse(c, http.StatusBadRequest, "VALIDATION_ERROR", err.Error())
		return
	}

	company, err := h.repos.Companies.Upsert(c.Request.Context(), userID, req.Name, req.Description, req.Location, req.IndustryID)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to upsert company")
		return
	}

	c.JSON(http.StatusOK, company)
}
