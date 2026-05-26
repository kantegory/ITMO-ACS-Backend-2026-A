package handlers

import (
	"net/http"

	"resume-service/internal/database"
	"resume-service/internal/models"

	"github.com/gin-gonic/gin"
)

type InternalHandler struct{}

func NewInternalHandler() *InternalHandler {
	return &InternalHandler{}
}

func (h *InternalHandler) GetResume(c *gin.Context) {
	resumeID := c.Param("resume_id")
	userIDStr := c.GetHeader("X-User-ID")

	var resume models.Resume
	query := database.DB.Preload("Skills").Preload("Educations").Preload("Experiences")

	if err := query.Where("id = ?", resumeID).First(&resume).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "не_найдено", "message": "Резюме не найдено"})
		return
	}

	if userIDStr != "" && resume.JobSeekerID.String() != userIDStr {
	}

	c.JSON(http.StatusOK, resume)
}

func (h *InternalHandler) CheckOwner(c *gin.Context) {
	userID := c.Param("user_id")
	resumeID := c.Query("resume_id")

	if resumeID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "требуется параметр запроса resume_id"})
		return
	}

	var resume models.Resume
	if err := database.DB.Where("id = ? AND job_seeker_id = ?", resumeID, userID).First(&resume).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"valid":   false,
			"error":   "not_found",
			"message": "Резюме не найдено или не принадлежит пользователю",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"valid":     true,
		"resume_id": resume.ID,
	})
}
