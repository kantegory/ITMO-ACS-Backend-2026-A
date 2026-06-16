package handlers

import (
	"net/http"
	"rental-api/internal/config"
	"rental-api/internal/models"
	"rental-api/internal/repositories"
	"rental-api/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

// ErrorResponse matches OpenAPI Error schema
type ErrorResponse struct {
	Error struct {
		Code    string `json:"code"`
		Message string `json:"message"`
		Details any    `json:"details,omitempty"`
	} `json:"error"`
}

type AuthHandler struct {
	authService services.AuthService
	cfg         *config.Config
	validate    *validator.Validate
}

func NewAuthHandler(cfg *config.Config) *AuthHandler {
	userRepo := repositories.NewUserRepository()
	authService := services.NewAuthService(userRepo, cfg)
	return &AuthHandler{
		authService: authService,
		cfg:         cfg,
		validate:    validator.New(),
	}
}

// RegisterRequest matches OpenAPI schema for /auth/register
type RegisterRequest struct {
	Email    string  `json:"email" binding:"required,email"`
	Password string  `json:"password" binding:"required,min=6"`
	FullName string  `json:"full_name" binding:"required,max=100"`
	Phone    *string `json:"phone,omitempty" binding:"omitempty,startswith=+,numeric"`
	Role     string  `json:"role" binding:"omitempty,oneof=tenant owner"`
}

// LoginRequest matches OpenAPI schema for /auth/login
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// TokenResponse matches OpenAPI schema for login response
type TokenResponse struct {
	AccessToken  string      `json:"access_token"`
	RefreshToken string      `json:"refresh_token"`
	User         interface{} `json:"user"`
}

// UserResponse matches OpenAPI schema UserResponse
type UserResponse struct {
	ID        uint   `json:"id"`
	Email     string `json:"email"`
	FullName  string `json:"full_name"`
	Phone     string `json:"phone,omitempty"`
	Role      string `json:"role"`
	CreatedAt string `json:"created_at"`
}

// Register godoc
// @Summary Register a new user
// @Description Create a new user account and return authentication tokens
// @Tags auth
// @Accept json
// @Produce json
// @Param request body RegisterRequest true "Registration data"
// @Success 201 {object} TokenResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /auth/register [post]
func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request", "details": err.Error()})
		return
	}

	// Validate using validator
	if err := h.validate.Struct(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "validation failed", "details": err.Error()})
		return
	}

	input := services.RegisterInput{
		Email:    req.Email,
		Password: req.Password,
		FullName: req.FullName,
		Phone:    req.Phone,
		Role:     req.Role,
	}

	user, accessToken, refreshToken, err := h.authService.Register(input)
	if err != nil {
		// TODO: distinguish between duplicate email and other errors
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         userToResponse(user),
	})
}

// Login godoc
// @Summary Authenticate user
// @Description Login with email and password to receive authentication tokens
// @Tags auth
// @Accept json
// @Produce json
// @Param request body LoginRequest true "Login credentials"
// @Success 200 {object} TokenResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Router /auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request", "details": err.Error()})
		return
	}

	user, accessToken, refreshToken, err := h.authService.Login(req.Email, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         userToResponse(user),
	})
}

func userToResponse(user *models.User) UserResponse {
	var phone string
	if user.Phone != nil {
		phone = *user.Phone
	}
	return UserResponse{
		ID:        user.ID,
		Email:     user.Email,
		FullName:  user.FullName,
		Phone:     phone,
		Role:      user.Role,
		CreatedAt: user.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}
}
