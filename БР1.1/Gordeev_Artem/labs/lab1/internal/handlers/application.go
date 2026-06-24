package handlers

import (
	"net/http"

	"jobboard/internal/database"
	"jobboard/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ApplicationHandler struct{}

func NewApplicationHandler() *ApplicationHandler {
	return &ApplicationHandler{}
}

func (h *ApplicationHandler) GetMyApplications(c *gin.Context) {
	userIDStr, _ := c.Get("user_id")
	userID := userIDStr.(uuid.UUID)

	var applications []models.JobApplication
	if err := database.DB.Preload("Job").Preload("Resume").Where("job_seeker_id = ?", userID).Find(&applications).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch applications"})
		return
	}

	c.JSON(http.StatusOK, applications)
}

func (h *ApplicationHandler) GetJobApplications(c *gin.Context) {
	userIDStr, _ := c.Get("user_id")
	userID := userIDStr.(uuid.UUID)

	jobIDParam := c.Param("id")
	jobID, err := uuid.Parse(jobIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid job ID"})
		return
	}

	var job models.Job
	if err := database.DB.Where("id = ? AND employer_id = ?", jobID, userID).First(&job).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Job not found or access denied"})
		return
	}

	query := database.DB.Model(&models.JobApplication{}).Preload("JobSeeker").Preload("Resume.Skills").Preload("Resume.Educations").Preload("Resume.Experiences").Where("job_id = ?", jobID)
	
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	var applications []models.JobApplication
	if err := query.Find(&applications).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch applications"})
		return
	}

	c.JSON(http.StatusOK, applications)
}

type ApplyRequest struct {
	ResumeID    uuid.UUID `json:"resume_id" binding:"required"`
	CoverLetter string    `json:"cover_letter"`
}

func (h *ApplicationHandler) Apply(c *gin.Context) {
	userIDStr, _ := c.Get("user_id")
	userID := userIDStr.(uuid.UUID)

	jobIDParam := c.Param("id")
	jobID, err := uuid.Parse(jobIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid job ID"})
		return
	}

	var req ApplyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request parameters"})
		return
	}

	var resume models.Resume
	if err := database.DB.Where("id = ? AND job_seeker_id = ?", req.ResumeID, userID).First(&resume).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Resume not found or access denied"})
		return
	}

	application := models.JobApplication{
		JobID:       jobID,
		JobSeekerID: userID,
		ResumeID:    req.ResumeID,
		CoverLetter: req.CoverLetter,
		Status:      models.AppSent,
	}

	if err := database.DB.Create(&application).Error; err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Application already exists or failed to create"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Applied successfully", "id": application.ID})
}

type StatusUpdateRequest struct {
	Status models.ApplicationStatus `json:"status" binding:"required"`
}

func (h *ApplicationHandler) UpdateStatus(c *gin.Context) {
	userIDStr, _ := c.Get("user_id")
	userID := userIDStr.(uuid.UUID)

	idParam := c.Param("id")
	appID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid application ID"})
		return
	}

	var req StatusUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request parameters"})
		return
	}

	var app models.JobApplication
	if err := database.DB.Preload("Job").First(&app, appID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Application not found"})
		return
	}

	if app.Job.EmployerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	app.Status = req.Status
	if err := database.DB.Save(&app).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Status updated successfully"})
}

func (h *ApplicationHandler) DeleteApplication(c *gin.Context) {
	userIDStr, _ := c.Get("user_id")
	userID := userIDStr.(uuid.UUID)

	idParam := c.Param("id")
	appID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid application ID"})
		return
	}

	var app models.JobApplication
	if err := database.DB.Where("id = ? AND job_seeker_id = ?", appID, userID).First(&app).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Application not found or access denied"})
		return
	}

	if err := database.DB.Delete(&app).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete application"})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}
