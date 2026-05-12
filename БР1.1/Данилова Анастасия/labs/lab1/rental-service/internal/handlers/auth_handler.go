package handlers

import (
	"net/http"
	"rental-service/internal/dto"
	"rental-service/internal/services"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	Service *services.AuthService
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req dto.RegisterRequest

	// parse JSON
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	user, err := h.Service.Register(req)
	if err != nil {
		if err.Error() == "user already exists" {
			c.JSON(http.StatusConflict, gin.H{"message": err.Error()})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":          user.ID,
		"email":       user.Email,
		"first_name":  user.FirstName,
		"last_name":   user.LastName,
		"role":        user.Role,
		"is_active":   user.IsActive,
		"is_verified": user.IsVerified,
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	secret, ok := c.Get("jwt_secret")
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "jwt secret is not configured"})
		return
	}

	resp, err := h.Service.Login(req, secret.(string))
	if err != nil {
		switch err.Error() {
		case "invalid credentials":
			c.JSON(http.StatusUnauthorized, gin.H{"message": err.Error()})
		case "user is inactive":
			c.JSON(http.StatusForbidden, gin.H{"message": err.Error()})
		default:
			c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, resp)
}
