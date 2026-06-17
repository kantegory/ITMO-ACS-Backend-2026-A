package handlers

import (
	"net/http"

	"profile-service/internal/clients"
	"profile-service/internal/database"
	"profile-service/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ProfileHandler struct {
	authClient *clients.AuthClient
}

func NewProfileHandler(authClient *clients.AuthClient) *ProfileHandler {
	return &ProfileHandler{authClient: authClient}
}

type JobSeekerProfileRequest struct {
	FirstName string `json:"first_name" binding:"required"`
	LastName  string `json:"last_name" binding:"required"`
	Phone     string `json:"phone"`
}

func (h *ProfileHandler) CreateOrUpdateJobSeekerProfile(c *gin.Context) {
	userIDStr := c.GetHeader("X-User-ID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Не авторизован"})
		return
	}

	_, err := h.authClient.ValidateUser(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверный пользователь"})
		return
	}

	userID, _ := uuid.Parse(userIDStr)

	var req JobSeekerProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверные параметры запроса"})
		return
	}

	var profile models.JobSeeker
	if err := database.DB.Where("user_id = ?", userID).First(&profile).Error; err != nil {
		profile = models.JobSeeker{
			UserID:    userID,
			FirstName: req.FirstName,
			LastName:  req.LastName,
			Phone:     req.Phone,
		}
		if err := database.DB.Create(&profile).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось создать профиль"})
			return
		}
		c.JSON(http.StatusCreated, gin.H{"message": "Профиль успешно создан"})
		return
	}

	profile.FirstName = req.FirstName
	profile.LastName = req.LastName
	profile.Phone = req.Phone

	if err := database.DB.Save(&profile).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось обновить профиль"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Профиль успешно обновлен"})
}

func (h *ProfileHandler) GetJobSeekerProfile(c *gin.Context) {
	userIDStr := c.GetHeader("X-User-ID")
	userID, _ := uuid.Parse(userIDStr)

	var profile models.JobSeeker
	if err := database.DB.Where("user_id = ?", userID).First(&profile).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Профиль не найден"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"first_name": profile.FirstName,
		"last_name":  profile.LastName,
		"phone":      profile.Phone,
	})
}

type EmployerProfileRequest struct {
	FirstName string `json:"first_name" binding:"required"`
	LastName  string `json:"last_name" binding:"required"`
	Position  string `json:"position"`
}

func (h *ProfileHandler) CreateOrUpdateEmployerProfile(c *gin.Context) {
	userIDStr := c.GetHeader("X-User-ID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Не авторизован"})
		return
	}

	_, err := h.authClient.ValidateUser(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверный пользователь"})
		return
	}

	userID, _ := uuid.Parse(userIDStr)

	var req EmployerProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверные параметры запроса"})
		return
	}

	var profile models.Employer
	if err := database.DB.Where("user_id = ?", userID).First(&profile).Error; err != nil {
		profile = models.Employer{
			UserID:    userID,
			FirstName: req.FirstName,
			LastName:  req.LastName,
			Position:  req.Position,
		}
		if err := database.DB.Create(&profile).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось создать профиль"})
			return
		}
		c.JSON(http.StatusCreated, gin.H{"message": "Профиль успешно создан"})
		return
	}

	profile.FirstName = req.FirstName
	profile.LastName = req.LastName
	profile.Position = req.Position

	if err := database.DB.Save(&profile).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось обновить профиль"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Профиль успешно обновлен"})
}

func (h *ProfileHandler) GetEmployerProfile(c *gin.Context) {
	userIDStr := c.GetHeader("X-User-ID")
	userID, _ := uuid.Parse(userIDStr)

	var profile models.Employer
	if err := database.DB.Where("user_id = ?", userID).First(&profile).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Профиль не найден"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"first_name": profile.FirstName,
		"last_name":  profile.LastName,
		"position":   profile.Position,
		"company_id": profile.CompanyID,
	})
}
