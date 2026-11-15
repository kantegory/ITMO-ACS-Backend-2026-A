package handlers

import (
	"net/http"
	"rental-api/internal/config"
	"rental-api/internal/models"
	"rental-api/internal/repositories"
	"rental-api/internal/services"
	"strconv"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	userService services.UserService
	cfg         *config.Config
}

func NewUserHandler(cfg *config.Config) *UserHandler {
	userRepo := repositories.NewUserRepository()
	userService := services.NewUserService(userRepo)
	return &UserHandler{userService: userService, cfg: cfg}
}

func (h *UserHandler) GetMe(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	// Convert userID to uint (assuming it's stored as uint)
	var uid uint
	switch v := userID.(type) {
	case uint:
		uid = v
	case float64:
		uid = uint(v)
	case int:
		uid = uint(v)
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user id type"})
		return
	}

	user, err := h.userService.GetUser(uid)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, userToMap(user))
}

func (h *UserHandler) UpdateMe(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	var req struct {
		FullName *string `json:"full_name,omitempty"`
		Phone    *string `json:"phone,omitempty"`
		Password *string `json:"password,omitempty"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	var uid uint
	switch v := userID.(type) {
	case uint:
		uid = v
	case float64:
		uid = uint(v)
	case int:
		uid = uint(v)
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user id type"})
		return
	}

	updates := services.UpdateUserInput{
		FullName: req.FullName,
		Phone:    req.Phone,
		Password: req.Password,
	}
	user, err := h.userService.UpdateUser(uid, updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, userToMap(user))
}

func (h *UserHandler) ChangeRole(c *gin.Context) {
	// Only admin can change roles (middleware ensures that)
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	var req struct {
		Role string `json:"role" binding:"required,oneof=tenant owner admin"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	user, err := h.userService.ChangeRole(uint(id), req.Role)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, userToMap(user))
}

func userToMap(user *models.User) gin.H {
	var phone string
	if user.Phone != nil {
		phone = *user.Phone
	}
	return gin.H{
		"id":         user.ID,
		"email":      user.Email,
		"full_name":  user.FullName,
		"phone":      phone,
		"role":       user.Role,
		"created_at": user.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}
}
