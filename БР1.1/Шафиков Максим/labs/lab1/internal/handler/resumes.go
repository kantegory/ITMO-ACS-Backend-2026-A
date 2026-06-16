package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"job-search/internal/middleware"
	"job-search/internal/model"
	"job-search/internal/repository"
)

type ResumesHandler struct {
	repos *repository.Repositories
}

type resumeCreateRequest struct {
	FullName *string     `json:"full_name"`
	Title    *string     `json:"title"`
	Bio      *string     `json:"bio"`
	SkillIDs []uuid.UUID `json:"skill_ids"`
}

type resumeUpdateRequest struct {
	FullName *string     `json:"full_name"`
	Title    *string     `json:"title"`
	Bio      *string     `json:"bio"`
	SkillIDs []uuid.UUID `json:"skill_ids"`
}

func (h *ResumesHandler) List(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		errorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}
	role, _ := middleware.GetUserRole(c)
	if role != string(model.RoleCandidate) {
		errorResponse(c, http.StatusForbidden, "FORBIDDEN", "Only candidates can list their resumes")
		return
	}

	resumes, err := h.repos.Resumes.ListByUserID(c.Request.Context(), userID)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to list resumes")
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": resumes})
}

func (h *ResumesHandler) Create(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		errorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}
	role, _ := middleware.GetUserRole(c)
	if role != string(model.RoleCandidate) {
		errorResponse(c, http.StatusForbidden, "FORBIDDEN", "Only candidates can create resumes")
		return
	}

	var req resumeCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		errorResponse(c, http.StatusBadRequest, "VALIDATION_ERROR", err.Error())
		return
	}

	resume, err := h.repos.Resumes.Create(c.Request.Context(), userID, req.FullName, req.Title, req.Bio, req.SkillIDs)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to create resume")
		return
	}

	c.JSON(http.StatusCreated, resume)
}

func (h *ResumesHandler) GetByID(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		errorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}
	role, _ := middleware.GetUserRole(c)

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		errorResponse(c, http.StatusBadRequest, "INVALID_ID", "Invalid resume ID")
		return
	}

	resume, err := h.repos.Resumes.GetByID(c.Request.Context(), id)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to get resume")
		return
	}
	if resume == nil {
		errorResponse(c, http.StatusNotFound, "NOT_FOUND", "Resume not found")
		return
	}

	// Candidates can only see their own resumes; employers can see any
	if role == string(model.RoleCandidate) && resume.UserID != userID {
		errorResponse(c, http.StatusForbidden, "FORBIDDEN", "You don't have access to this resume")
		return
	}

	c.JSON(http.StatusOK, resume)
}

func (h *ResumesHandler) Update(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		errorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		errorResponse(c, http.StatusBadRequest, "INVALID_ID", "Invalid resume ID")
		return
	}

	resume, err := h.repos.Resumes.GetByID(c.Request.Context(), id)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to get resume")
		return
	}
	if resume == nil {
		errorResponse(c, http.StatusNotFound, "NOT_FOUND", "Resume not found")
		return
	}
	if resume.UserID != userID {
		errorResponse(c, http.StatusForbidden, "FORBIDDEN", "You don't own this resume")
		return
	}

	var req resumeUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		errorResponse(c, http.StatusBadRequest, "VALIDATION_ERROR", err.Error())
		return
	}

	updated, err := h.repos.Resumes.Update(c.Request.Context(), id, req.FullName, req.Title, req.Bio, req.SkillIDs)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to update resume")
		return
	}
	if updated == nil {
		errorResponse(c, http.StatusNotFound, "NOT_FOUND", "Resume not found")
		return
	}

	c.JSON(http.StatusOK, updated)
}

func (h *ResumesHandler) Delete(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		errorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		errorResponse(c, http.StatusBadRequest, "INVALID_ID", "Invalid resume ID")
		return
	}

	resume, err := h.repos.Resumes.GetByID(c.Request.Context(), id)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to get resume")
		return
	}
	if resume == nil {
		errorResponse(c, http.StatusNotFound, "NOT_FOUND", "Resume not found")
		return
	}
	if resume.UserID != userID {
		errorResponse(c, http.StatusForbidden, "FORBIDDEN", "You don't own this resume")
		return
	}

	hasApps, err := h.repos.Resumes.HasActiveApplications(c.Request.Context(), id)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to check applications")
		return
	}
	if hasApps {
		errorResponse(c, http.StatusConflict, "RESUME_IN_USE", "Resume is used in applications and cannot be deleted")
		return
	}

	if err := h.repos.Resumes.Delete(c.Request.Context(), id); err != nil {
		errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to delete resume")
		return
	}

	c.Status(http.StatusNoContent)
}
