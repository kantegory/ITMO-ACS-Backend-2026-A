package handlers

import (
	"net/http"

	"profile-service/internal/database"
	"profile-service/internal/models"

	"github.com/gin-gonic/gin"
)

type InternalHandler struct{}

func NewInternalHandler() *InternalHandler {
	return &InternalHandler{}
}

func (h *InternalHandler) GetCompany(c *gin.Context) {
	companyID := c.Param("company_id")

	var company models.Company
	if err := database.DB.Where("id = ?", companyID).First(&company).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "не_найдено", "message": "Компания не найдена"})
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

func (h *InternalHandler) GetEmployer(c *gin.Context) {
	userID := c.Param("user_id")

	var employer models.Employer
	if err := database.DB.Where("user_id = ?", userID).First(&employer).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "не_найдено", "message": "Профиль работодателя не найден"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user_id":    employer.UserID,
		"company_id": employer.CompanyID,
		"first_name": employer.FirstName,
		"last_name":  employer.LastName,
		"position":   employer.Position,
	})
}

func (h *InternalHandler) GetJobSeeker(c *gin.Context) {
	userID := c.Param("user_id")

	var js models.JobSeeker
	if err := database.DB.Where("user_id = ?", userID).First(&js).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "не_найдено", "message": "Профиль соискателя не найден"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user_id":    js.UserID,
		"first_name": js.FirstName,
		"last_name":  js.LastName,
		"phone":      js.Phone,
	})
}
