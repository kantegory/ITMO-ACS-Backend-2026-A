package handler

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"github.com/ZZISST/rental-api/internal/middleware"
	"github.com/ZZISST/rental-api/internal/model"
	"github.com/ZZISST/rental-api/internal/repository"
)

type AuthHandler struct {
	userRepo  *repository.UserRepository
	jwtSecret string
}

func NewAuthHandler(userRepo *repository.UserRepository, jwtSecret string) *AuthHandler {
	return &AuthHandler{userRepo: userRepo, jwtSecret: jwtSecret}
}

// Register godoc
// @Summary      Регистрация пользователя
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        body body model.RegisterRequest true "Данные для регистрации"
// @Success      201 {object} model.User
// @Failure      400 {object} model.ErrorResponse
// @Failure      409 {object} model.ErrorResponse "Email или телефон уже занят"
// @Router       /auth/register [post]
func (h *AuthHandler) Register(c *gin.Context) {
	var req model.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{Code: 400, Message: "invalid request", Details: err.Error()})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: "internal error"})
		return
	}

	user, err := h.userRepo.Create(req, string(hash))
	if err != nil {
		c.JSON(http.StatusConflict, model.ErrorResponse{Code: 409, Message: "email or phone already taken"})
		return
	}

	c.JSON(http.StatusCreated, user)
}

// Login godoc
// @Summary      Вход в систему
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        body body model.LoginRequest true "Учётные данные"
// @Success      200 {object} model.TokenResponse
// @Failure      400 {object} model.ErrorResponse
// @Failure      401 {object} model.ErrorResponse "Неверный email или пароль"
// @Router       /auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req model.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{Code: 400, Message: "invalid request", Details: err.Error()})
		return
	}

	user, err := h.userRepo.FindByEmail(req.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, model.ErrorResponse{Code: 401, Message: "invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, model.ErrorResponse{Code: 401, Message: "invalid credentials"})
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	})
	tokenString, err := token.SignedString([]byte(h.jwtSecret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: "failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, model.TokenResponse{AccessToken: tokenString})
}

// Me godoc
// @Summary      Текущий пользователь
// @Tags         users
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} model.User
// @Failure      401 {object} model.ErrorResponse
// @Failure      404 {object} model.ErrorResponse
// @Router       /users/me [get]
func (h *AuthHandler) Me(c *gin.Context) {
	userID := middleware.GetUserID(c)
	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, model.ErrorResponse{Code: 404, Message: "user not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: "internal error"})
		return
	}
	c.JSON(http.StatusOK, user)
}
