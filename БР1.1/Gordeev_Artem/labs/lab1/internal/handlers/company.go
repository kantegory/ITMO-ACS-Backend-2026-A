package handlers

import (
	"net/http"

	"jobboard/internal/database"
	"jobboard/internal/models"

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
	userIDStr, _ := c.Get("user_id")
	userID := userIDStr.(uuid.UUID)

	var req CompanyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request parameters"})
		return
	}

	var employer models.Employer
	if err := database.DB.Where("user_id = ?", userID).First(&employer).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Employer profile not found"})
		return
	}

	if employer.CompanyID != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Employer already belongs to a company"})
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create company"})
		return
	}

	employer.CompanyID = &company.ID
	if err := tx.Save(&employer).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to link company to employer"})
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid company ID"})
		return
	}

	var company models.Company
	if err := database.DB.First(&company, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Company not found"})
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
	userIDStr, _ := c.Get("user_id")
	userID := userIDStr.(uuid.UUID)

	idParam := c.Param("id")
	companyID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid company ID"})
		return
	}

	var employer models.Employer
	if err := database.DB.Where("user_id = ?", userID).First(&employer).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Employer profile not found"})
		return
	}

	if employer.CompanyID == nil || *employer.CompanyID != companyID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You do not have permission to edit this company"})
		return
	}

	var req CompanyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request parameters"})
		return
	}

	var company models.Company
	if err := database.DB.First(&company, companyID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Company not found"})
		return
	}

	company.Name = req.Name
	company.Description = req.Description
	company.Website = req.Website

	if err := database.DB.Save(&company).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update company"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Company updated successfully"})
}
