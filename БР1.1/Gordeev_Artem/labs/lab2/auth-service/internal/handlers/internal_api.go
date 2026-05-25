package handlers

import (
	"net/http"

	"auth-service/internal/database"
	"auth-service/internal/models"

	"github.com/gin-gonic/gin"
)

type InternalHandler struct{}

func NewInternalHandler() *InternalHandler {
	return &InternalHandler{}
}

func (h *InternalHandler) GetUser(c *gin.Context) {
	userID := c.Param("id")

	var user models.User
	if err := database.DB.Select("id", "email", "role", "created_at").Where("id = ?", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "не_найдено", "message": "Пользователь не найден"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":         user.ID,
		"email":      user.Email,
		"role":       user.Role,
		"created_at": user.CreatedAt,
	})
}

type BatchRequest struct {
	UserIDs []string `json:"user_ids" binding:"required"`
}

func (h *InternalHandler) GetUsersBatch(c *gin.Context) {
	var req BatchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный запрос"})
		return
	}

	if len(req.UserIDs) == 0 {
		c.JSON(http.StatusOK, gin.H{"users": []interface{}{}})
		return
	}

	var users []models.User
	if err := database.DB.Select("id", "email", "role").Where("id IN ?", req.UserIDs).Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось получить пользователей"})
		return
	}

	var response []gin.H
	for _, user := range users {
		response = append(response, gin.H{
			"id":    user.ID,
			"email": user.Email,
			"role":  user.Role,
		})
	}

	c.JSON(http.StatusOK, gin.H{"users": response})
}
