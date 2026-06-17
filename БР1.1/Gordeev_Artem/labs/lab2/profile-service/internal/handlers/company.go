package handlers

import (
	"net/http"

	"profile-service/internal/database"
	"profile-service/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CompanyHandler struct{}

func NewCompanyHandler() *CompanyHandler {
	return &CompanyHandler{}
}

type CompanyRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Website     string `json:"website"`
}

func (h *CompanyHandler) Create(c *gin.Context) {
	userIDStr := c.GetHeader("X-User-ID")
	userID, _ := uuid.Parse(userIDStr)

	var req CompanyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверные параметры запроса"})
		return
	}

	var employer models.Employer
	if err := database.DB.Where("user_id = ?", userID).First(&employer).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Профиль работодателя не найден. Сначала создайте его."})
		return
	}

	if employer.CompanyID != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Работодатель уже состоит в компании"})
		return
	}

	tx := database.DB.Begin()

	company := models.Company{
		Name:        req.Name,
		Description: req.Description,
		Website:     req.Website,
	}

	if err := tx.Create(&company).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось создать компанию"})
		return
	}

	employer.CompanyID = &company.ID
	if err := tx.Save(&employer).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось привязать компанию к работодателю"})
		return
	}

	tx.Commit()

	c.JSON(http.StatusCreated, gin.H{
		"id":          company.ID,
		"name":        company.Name,
		"description": company.Description,
		"website":     company.Website,
		"created_at":  company.CreatedAt,
	})
}

func (h *CompanyHandler) Get(c *gin.Context) {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID компании"})
		return
	}

	var company models.Company
	if err := database.DB.First(&company, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Компания не найдена"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":          company.ID,
		"name":        company.Name,
		"description": company.Description,
		"website":     company.Website,
		"created_at":  company.CreatedAt,
	})
}

func (h *CompanyHandler) Update(c *gin.Context) {
	userIDStr := c.GetHeader("X-User-ID")
	userID, _ := uuid.Parse(userIDStr)

	idParam := c.Param("id")
	companyID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID компании"})
		return
	}

	var employer models.Employer
	if err := database.DB.Where("user_id = ?", userID).First(&employer).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Профиль работодателя не найден"})
		return
	}

	if employer.CompanyID == nil || *employer.CompanyID != companyID {
		c.JSON(http.StatusForbidden, gin.H{"error": "У вас нет прав на редактирование этой компании"})
		return
	}

	var req CompanyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверные параметры запроса"})
		return
	}

	var company models.Company
	if err := database.DB.First(&company, companyID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Компания не найдена"})
		return
	}

	company.Name = req.Name
	company.Description = req.Description
	company.Website = req.Website

	if err := database.DB.Save(&company).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось обновить компанию"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Компания успешно обновлена"})
}
