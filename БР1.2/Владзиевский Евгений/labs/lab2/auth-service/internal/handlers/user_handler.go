package handlers

import (
	"auth-service/internal/config"
	"auth-service/internal/repositories"
	"auth-service/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	userService *services.UserService
	cfg         *config.Config
}

func NewUserHandler(cfg *config.Config, outboxRepo *repositories.OutboxRepository) *UserHandler {
	userRepo := repositories.NewUserRepository()
	userService := services.NewUserService(userRepo, outboxRepo)
	return &UserHandler{userService: userService, cfg: cfg}
}

func (h *UserHandler) GetMe(c *gin.Context) {
	userID := getUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"code": "UNAUTHORIZED", "message": "User not authenticated"}})
		return
	}

	user, err := h.userService.GetUser(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": "User not found"}})
		return
	}

	c.JSON(http.StatusOK, userToResponse(user))
}

func (h *UserHandler) UpdateMe(c *gin.Context) {
	userID := getUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"code": "UNAUTHORIZED", "message": "User not authenticated"}})
		return
	}

	var req struct {
		FullName *string `json:"full_name,omitempty"`
		Phone    *string `json:"phone,omitempty"`
		Password *string `json:"password,omitempty"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "VALIDATION_ERROR", "message": "Invalid request"}})
		return
	}

	updates := services.UpdateUserInput{
		FullName: req.FullName,
		Phone:    req.Phone,
		Password: req.Password,
	}
	user, err := h.userService.UpdateUser(userID, updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "UPDATE_ERROR", "message": err.Error()}})
		return
	}

	c.JSON(http.StatusOK, userToResponse(user))
}

func (h *UserHandler) ChangeRole(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "VALIDATION_ERROR", "message": "Invalid user ID"}})
		return
	}

	var req struct {
		Role string `json:"role" binding:"required,oneof=tenant owner admin"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "VALIDATION_ERROR", "message": "Invalid request"}})
		return
	}

	user, err := h.userService.ChangeRole(uint(id), req.Role)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": "User not found"}})
		return
	}

	c.JSON(http.StatusOK, userToResponse(user))
}

func getUserID(c *gin.Context) uint {
	uid, exists := c.Get("user_id")
	if !exists {
		return 0
	}
	switch v := uid.(type) {
	case uint:
		return v
	case float64:
		return uint(v)
	case int:
		return uint(v)
	default:
		return 0
	}
}

