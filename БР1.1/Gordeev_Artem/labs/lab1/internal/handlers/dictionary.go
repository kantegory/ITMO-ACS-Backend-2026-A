package handlers

import (
	"net/http"

	"jobboard/internal/database"
	"jobboard/internal/models"

	"github.com/gin-gonic/gin"
)

type DictionaryHandler struct{}

func NewDictionaryHandler() *DictionaryHandler {
	return &DictionaryHandler{}
}

func (h *DictionaryHandler) GetIndustries(c *gin.Context) {
	var industries []models.Industry
	if err := database.DB.Find(&industries).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch industries"})
		return
	}

	c.JSON(http.StatusOK, industries)
}
