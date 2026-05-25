package handlers

import (
	"net/http"

	"job-service/internal/database"
	"job-service/internal/models"

	"github.com/gin-gonic/gin"
)

type DictionaryHandler struct{}

func NewDictionaryHandler() *DictionaryHandler {
	return &DictionaryHandler{}
}

func (h *DictionaryHandler) GetIndustries(c *gin.Context) {
	var industries []models.Industry
	if err := database.DB.Find(&industries).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось получить отрасли"})
		return
	}

	c.JSON(http.StatusOK, industries)
}
