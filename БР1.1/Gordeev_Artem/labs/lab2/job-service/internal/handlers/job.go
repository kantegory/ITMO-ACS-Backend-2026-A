package handlers

import (
	"net/http"
	"strconv"

	"job-service/internal/clients"
	"job-service/internal/database"
	"job-service/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type JobHandler struct {
	profileClient *clients.ProfileClient
}

func NewJobHandler(profileClient *clients.ProfileClient) *JobHandler {
	return &JobHandler{profileClient: profileClient}
}

type JobRequest struct {
	Title        string                 `json:"title" binding:"required"`
	Description  string                 `json:"description" binding:"required"`
	Requirements string                 `json:"requirements" binding:"required"`
	IndustryID   uint                   `json:"industry_id" binding:"required"`
	SalaryMin    float64                `json:"salary_min"`
	SalaryMax    float64                `json:"salary_max"`
	Experience   models.ExperienceLevel `json:"experience" binding:"required"`
	Status       models.JobStatus       `json:"status" binding:"required"`
}

func (h *JobHandler) Create(c *gin.Context) {
	userIDStr := c.GetHeader("X-User-ID")
	userID, _ := uuid.Parse(userIDStr)

	var req JobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверные параметры запроса"})
		return
	}

	employer, err := h.profileClient.GetEmployer(userIDStr)
	if err != nil || employer == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Профиль работодателя не найден"})
		return
	}

	if employer.CompanyID == nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Работодатель должен принадлежать компании для создания вакансий"})
		return
	}
	companyID, _ := uuid.Parse(*employer.CompanyID)

	job := models.Job{
		EmployerID:   userID,
		CompanyID:    companyID,
		IndustryID:   req.IndustryID,
		Title:        req.Title,
		Description:  req.Description,
		Requirements: req.Requirements,
		SalaryMin:    req.SalaryMin,
		SalaryMax:    req.SalaryMax,
		Experience:   req.Experience,
		Status:       req.Status,
	}

	if err := database.DB.Create(&job).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось создать вакансию"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Вакансия успешно создана", "id": job.ID})
}

func (h *JobHandler) GetJobs(c *gin.Context) {
	query := database.DB.Model(&models.Job{}).Preload("Industry")

	if q := c.Query("query"); q != "" {
		query = query.Where("title ILIKE ? OR description ILIKE ?", "%"+q+"%", "%"+q+"%")
	}
	if ind := c.Query("industry_id"); ind != "" {
		query = query.Where("industry_id = ?", ind)
	}
	if sal := c.Query("salary_expected"); sal != "" {
		if s, err := strconv.ParseFloat(sal, 64); err == nil {
			query = query.Where("salary_min <= ? AND (salary_max >= ? OR salary_max = 0)", s, s)
		}
	}
	if exp := c.Query("experience"); exp != "" {
		query = query.Where("experience = ?", exp)
	}
	query = query.Where("status = ?", models.JobActive)

	var jobs []models.Job
	if err := query.Find(&jobs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось получить вакансии"})
		return
	}

	c.JSON(http.StatusOK, jobs)
}

func (h *JobHandler) Get(c *gin.Context) {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID вакансии"})
		return
	}

	var job models.Job
	if err := database.DB.Preload("Industry").First(&job, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Вакансия не найдена"})
		return
	}

	c.JSON(http.StatusOK, job)
}

func (h *JobHandler) Update(c *gin.Context) {
	userIDStr := c.GetHeader("X-User-ID")
	userID, _ := uuid.Parse(userIDStr)

	idParam := c.Param("id")
	jobID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID вакансии"})
		return
	}

	var req JobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверные параметры запроса"})
		return
	}

	var job models.Job
	if err := database.DB.Where("id = ? AND employer_id = ?", jobID, userID).First(&job).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Вакансия не найдена или доступ запрещен"})
		return
	}

	job.Title = req.Title
	job.Description = req.Description
	job.Requirements = req.Requirements
	job.IndustryID = req.IndustryID
	job.SalaryMin = req.SalaryMin
	job.SalaryMax = req.SalaryMax
	job.Experience = req.Experience
	job.Status = req.Status

	if err := database.DB.Save(&job).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось обновить вакансию"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Вакансия успешно обновлена"})
}

func (h *JobHandler) Delete(c *gin.Context) {
	userIDStr := c.GetHeader("X-User-ID")
	userID, _ := uuid.Parse(userIDStr)

	idParam := c.Param("id")
	jobID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID вакансии"})
		return
	}

	var job models.Job
	if err := database.DB.Where("id = ? AND employer_id = ?", jobID, userID).First(&job).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Вакансия не найдена или доступ запрещен"})
		return
	}

	job.Status = models.JobArchived
	if err := database.DB.Save(&job).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось архивировать вакансию"})
		return
	}

	c.Status(http.StatusNoContent)
}
