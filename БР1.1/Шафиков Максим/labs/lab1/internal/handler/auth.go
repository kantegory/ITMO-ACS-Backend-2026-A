package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"

	"job-search/internal/middleware"
	"job-search/internal/model"
	"job-search/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	repos     *repository.Repositories
	jwtSecret string
}

type registerRequest struct {
	Email    string         `json:"email" binding:"required,email"`
	Password string         `json:"password" binding:"required,min=8"`
	Role     model.UserRole `json:"role" binding:"required,oneof=candidate employer"`
}

type loginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type authResponse struct {
	AccessToken string      `json:"access_token"`
	TokenType   string      `json:"token_type"`
	ExpiresIn   int         `json:"expires_in"`
	User        *model.User `json:"user"`
}

func (h *AuthHandler) generateToken(user *model.User) (string, error) {
	claims := middleware.Claims{
		UserID: user.ID,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(h.jwtSecret))
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		errorResponse(c, http.StatusBadRequest, "VALIDATION_ERROR", err.Error())
		return
	}

	existing, err := h.repos.Users.GetByEmail(c.Request.Context(), req.Email)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to check email")
		return
	}
	if existing != nil {
		errorResponse(c, http.StatusConflict, "EMAIL_CONFLICT", "Email is already registered")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to hash password")
		return
	}

	user, err := h.repos.Users.Create(c.Request.Context(), req.Email, string(hash), req.Role)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to create user")
		return
	}

	tokenStr, err := h.generateToken(user)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to generate token")
		return
	}

	c.JSON(http.StatusCreated, authResponse{
		AccessToken: tokenStr,
		TokenType:   "Bearer",
		ExpiresIn:   3600,
		User:        user,
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		errorResponse(c, http.StatusBadRequest, "VALIDATION_ERROR", err.Error())
		return
	}

	user, err := h.repos.Users.GetByEmail(c.Request.Context(), req.Email)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to find user")
		return
	}
	if user == nil {
		errorResponse(c, http.StatusUnauthorized, "INVALID_CREDENTIALS", "Invalid email or password")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		errorResponse(c, http.StatusUnauthorized, "INVALID_CREDENTIALS", "Invalid email or password")
		return
	}

	tokenStr, err := h.generateToken(user)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to generate token")
		return
	}

	c.JSON(http.StatusOK, authResponse{
		AccessToken: tokenStr,
		TokenType:   "Bearer",
		ExpiresIn:   3600,
		User:        user,
	})
}
