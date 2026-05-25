package handlers

import (
	"net/http"

	"job-service/internal/clients"
	"job-service/internal/database"
	"job-service/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ApplicationHandler struct {
	resumeClient *clients.ResumeClient
}

func NewApplicationHandler(resumeClient *clients.ResumeClient) *ApplicationHandler {
	return &ApplicationHandler{resumeClient: resumeClient}
}

func (h *ApplicationHandler) GetMyApplications(c *gin.Context) {
	userIDStr := c.GetHeader("X-User-ID")
	userID, _ := uuid.Parse(userIDStr)

	var applications []models.JobApplication
	if err := database.DB.Preload("Job").Where("job_seeker_id = ?", userID).Find(&applications).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось получить заявки"})
		return
	}

	c.JSON(http.StatusOK, applications)
}

func (h *ApplicationHandler) GetJobApplications(c *gin.Context) {
	userIDStr := c.GetHeader("X-User-ID")
	userID, _ := uuid.Parse(userIDStr)

	jobIDParam := c.Param("id")
	jobID, err := uuid.Parse(jobIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID вакансии"})
		return
	}

	var job models.Job
	if err := database.DB.Where("id = ? AND employer_id = ?", jobID, userID).First(&job).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Вакансия не найдена или доступ запрещен"})
		return
	}

	query := database.DB.Model(&models.JobApplication{}).Where("job_id = ?", jobID)
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	var applications []models.JobApplication
	if err := query.Find(&applications).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось получить заявки"})
		return
	}

	c.JSON(http.StatusOK, applications)
}

type ApplyRequest struct {
	ResumeID    uuid.UUID `json:"resume_id" binding:"required"`
	CoverLetter string    `json:"cover_letter"`
}

func (h *ApplicationHandler) Apply(c *gin.Context) {
	userIDStr := c.GetHeader("X-User-ID")
	userID, _ := uuid.Parse(userIDStr)

	jobIDParam := c.Param("id")
	jobID, err := uuid.Parse(jobIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID вакансии"})
		return
	}

	var req ApplyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверные параметры запроса"})
		return
	}

	valid, err := h.resumeClient.CheckOwner(userIDStr, req.ResumeID.String())
	if err != nil || !valid {
		c.JSON(http.StatusNotFound, gin.H{"error": "Резюме не найдено или доступ запрещен"})
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
		c.JSON(http.StatusConflict, gin.H{"error": "Заявка уже существует или не удалось создать"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Успешно откликнулись", "id": application.ID})
}

type StatusUpdateRequest struct {
	Status models.ApplicationStatus `json:"status" binding:"required"`
}

func (h *ApplicationHandler) UpdateStatus(c *gin.Context) {
	userIDStr := c.GetHeader("X-User-ID")
	userID, _ := uuid.Parse(userIDStr)

	idParam := c.Param("id")
	appID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID заявки"})
		return
	}

	var req StatusUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверные параметры запроса"})
		return
	}

	var app models.JobApplication
	if err := database.DB.Preload("Job").First(&app, appID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Заявка не найдена"})
		return
	}

	if app.Job.EmployerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Доступ запрещен"})
		return
	}

	app.Status = req.Status
	if err := database.DB.Save(&app).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось обновить статус"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Статус успешно обновлен"})
}

func (h *ApplicationHandler) DeleteApplication(c *gin.Context) {
	userIDStr := c.GetHeader("X-User-ID")
	userID, _ := uuid.Parse(userIDStr)

	idParam := c.Param("id")
	appID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID заявки"})
		return
	}

	var app models.JobApplication
	if err := database.DB.Where("id = ? AND job_seeker_id = ?", appID, userID).First(&app).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Заявка не найдена или доступ запрещен"})
		return
	}

	if err := database.DB.Delete(&app).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось удалить заявку"})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}
