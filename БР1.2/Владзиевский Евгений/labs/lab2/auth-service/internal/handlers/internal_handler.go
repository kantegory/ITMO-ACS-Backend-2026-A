package handlers

import (
	"auth-service/internal/config"
	"auth-service/internal/repositories"
	"auth-service/internal/services"
	"auth-service/internal/utils"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type InternalHandler struct {
	userService *services.UserService
	userRepo    *repositories.UserRepository
	cfg         *config.Config
}

func NewInternalHandler(cfg *config.Config, outboxRepo *repositories.OutboxRepository) *InternalHandler {
	userRepo := repositories.NewUserRepository()
	userService := services.NewUserService(userRepo, outboxRepo)
	return &InternalHandler{userService: userService, userRepo: userRepo, cfg: cfg}
}

func (h *InternalHandler) ValidateToken(c *gin.Context) {
	var req struct {
		Token string `json:"token" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "INVALID_REQUEST", "message": "Token is required"}})
		return
	}

	claims, err := utils.ValidateToken(req.Token, h.cfg.JWTSecret)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"valid":   false,
			"error":   "token_invalid",
			"message": "Invalid or expired token",
		})
		return
	}

	user, err := h.userService.GetUser(claims.UserID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"valid":   false,
			"error":   "user_not_found",
			"message": "User not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"valid": true,
		"user": gin.H{
			"id":        user.ID,
			"email":     user.Email,
			"role":      user.Role,
			"full_name": user.FullName,
		},
	})
}

func (h *InternalHandler) GetUserByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "INVALID_REQUEST", "message": "Invalid user ID"}})
		return
	}

	user, err := h.userService.GetUser(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "USER_NOT_FOUND", "message": "User not found"}})
		return
	}

	var phone string
	if user.Phone != nil {
		phone = *user.Phone
	}
	c.JSON(http.StatusOK, gin.H{
		"id":        user.ID,
		"email":     user.Email,
		"full_name": user.FullName,
		"phone":     phone,
		"role":      user.Role,
	})
}

func (h *InternalHandler) GetUsersBatch(c *gin.Context) {
	var req struct {
		IDs []uint `json:"ids" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "INVALID_REQUEST", "message": "IDs array is required"}})
		return
	}

	if len(req.IDs) == 0 || len(req.IDs) > 100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "INVALID_REQUEST", "message": "IDs array must contain 1-100 elements"}})
		return
	}

	users, notFound := h.userRepo.FindByIDs(req.IDs)

	userResponses := make([]gin.H, len(users))
	for i, u := range users {
		var phone string
		if u.Phone != nil {
			phone = *u.Phone
		}
		userResponses[i] = gin.H{
			"id":        u.ID,
			"full_name":  u.FullName,
			"role":      u.Role,
			"email":     u.Email,
			"phone":     phone,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"users":     userResponses,
		"not_found": notFound,
	})
}

func (h *InternalHandler) GetUserRole(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "INVALID_REQUEST", "message": "Invalid user ID"}})
		return
	}

	user, err := h.userService.GetUser(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "USER_NOT_FOUND", "message": "User not found"}})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user_id": user.ID,
		"role":    user.Role,
	})
}