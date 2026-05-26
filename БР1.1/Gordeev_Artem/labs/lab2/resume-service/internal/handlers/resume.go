package handlers

import (
	"net/http"
	"time"

	"resume-service/internal/database"
	"resume-service/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ResumeHandler struct{}

func NewResumeHandler() *ResumeHandler {
	return &ResumeHandler{}
}

type SkillRequest struct {
	Name string `json:"name" binding:"required"`
}

type EducationRequest struct {
	Institution string     `json:"institution" binding:"required"`
	Degree      string     `json:"degree" binding:"required"`
	StartDate   time.Time  `json:"start_date" binding:"required"`
	EndDate     *time.Time `json:"end_date"`
}

type ExperienceRequest struct {
	CompanyName string     `json:"company_name" binding:"required"`
	Position    string     `json:"position" binding:"required"`
	Description string     `json:"description"`
	StartDate   time.Time  `json:"start_date" binding:"required"`
	EndDate     *time.Time `json:"end_date"`
}

type ResumeRequest struct {
	Title             string              `json:"title" binding:"required"`
	Summary           string              `json:"summary"`
	SalaryExpectation float64             `json:"salary_expectation"`
	IsActive          bool                `json:"is_active"`
	Skills            []SkillRequest      `json:"skills"`
	Educations        []EducationRequest  `json:"educations"`
	Experiences       []ExperienceRequest `json:"experiences"`
}

func (h *ResumeHandler) Create(c *gin.Context) {
	userIDStr := c.GetHeader("X-User-ID")
	userID, _ := uuid.Parse(userIDStr)

	var req ResumeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверные параметры запроса"})
		return
	}

	tx := database.DB.Begin()

	resume := models.Resume{
		JobSeekerID:       userID,
		Title:             req.Title,
		Summary:           req.Summary,
		SalaryExpectation: req.SalaryExpectation,
		IsActive:          req.IsActive,
	}

	if err := tx.Create(&resume).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось создать резюме"})
		return
	}

	for _, s := range req.Skills {
		if err := tx.Create(&models.Skill{ResumeID: resume.ID, Name: s.Name}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось сохранить навыки"})
			return
		}
	}

	for _, e := range req.Educations {
		if err := tx.Create(&models.Education{
			ResumeID:    resume.ID,
			Institution: e.Institution,
			Degree:      e.Degree,
			StartDate:   e.StartDate,
			EndDate:     e.EndDate,
		}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось сохранить образование"})
			return
		}
	}

	for _, exp := range req.Experiences {
		if err := tx.Create(&models.Experience{
			ResumeID:    resume.ID,
			CompanyName: exp.CompanyName,
			Position:    exp.Position,
			Description: exp.Description,
			StartDate:   exp.StartDate,
			EndDate:     exp.EndDate,
		}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось сохранить опыт"})
			return
		}
	}

	tx.Commit()
	c.JSON(http.StatusCreated, gin.H{"message": "Резюме успешно создано", "id": resume.ID})
}

func (h *ResumeHandler) GetMyResumes(c *gin.Context) {
	userIDStr := c.GetHeader("X-User-ID")
	userID, _ := uuid.Parse(userIDStr)

	var resumes []models.Resume
	if err := database.DB.Preload("Skills").Preload("Educations").Preload("Experiences").Where("job_seeker_id = ?", userID).Find(&resumes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось получить резюме"})
		return
	}

	c.JSON(http.StatusOK, resumes)
}

func (h *ResumeHandler) Get(c *gin.Context) {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID резюме"})
		return
	}

	var resume models.Resume
	if err := database.DB.Preload("Skills").Preload("Educations").Preload("Experiences").First(&resume, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Resume not found"})
		return
	}

	c.JSON(http.StatusOK, resume)
}

func (h *ResumeHandler) Update(c *gin.Context) {
	userIDStr := c.GetHeader("X-User-ID")
	userID, _ := uuid.Parse(userIDStr)

	idParam := c.Param("id")
	resumeID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID резюме"})
		return
	}

	var req ResumeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверные параметры запроса"})
		return
	}

	tx := database.DB.Begin()

	var resume models.Resume
	if err := tx.Where("id = ? AND job_seeker_id = ?", resumeID, userID).First(&resume).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Резюме не найдено или доступ запрещен"})
		return
	}

	resume.Title = req.Title
	resume.Summary = req.Summary
	resume.SalaryExpectation = req.SalaryExpectation
	resume.IsActive = req.IsActive

	if err := tx.Save(&resume).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось обновить резюме"})
		return
	}

	tx.Where("resume_id = ?", resume.ID).Delete(&models.Skill{})
	tx.Where("resume_id = ?", resume.ID).Delete(&models.Education{})
	tx.Where("resume_id = ?", resume.ID).Delete(&models.Experience{})

	for _, s := range req.Skills {
		tx.Create(&models.Skill{ResumeID: resume.ID, Name: s.Name})
	}

	for _, e := range req.Educations {
		tx.Create(&models.Education{
			ResumeID:    resume.ID,
			Institution: e.Institution,
			Degree:      e.Degree,
			StartDate:   e.StartDate,
			EndDate:     e.EndDate,
		})
	}

	for _, exp := range req.Experiences {
		tx.Create(&models.Experience{
			ResumeID:    resume.ID,
			CompanyName: exp.CompanyName,
			Position:    exp.Position,
			Description: exp.Description,
			StartDate:   exp.StartDate,
			EndDate:     exp.EndDate,
		})
	}

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"message": "Resume updated successfully"})
}

func (h *ResumeHandler) Delete(c *gin.Context) {
	userIDStr := c.GetHeader("X-User-ID")
	userID, _ := uuid.Parse(userIDStr)

	idParam := c.Param("id")
	resumeID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID резюме"})
		return
	}

	var resume models.Resume
	if err := database.DB.Where("id = ? AND job_seeker_id = ?", resumeID, userID).First(&resume).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Резюме не найдено или доступ запрещен"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка базы данных"})
		}
		return
	}

	if err := database.DB.Delete(&resume).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось удалить резюме"})
		return
	}

	c.Status(http.StatusNoContent)
}
