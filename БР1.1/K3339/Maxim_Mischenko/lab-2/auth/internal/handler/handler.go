package handler

import (
	"auth/internal/models"
	"auth/internal/repository"
	"auth/internal/service"
	"encoding/json"
	"net/http"

	"github.com/go-playground/validator/v10"
)

var validate = validator.New()

type AuthHandler struct {
	repo *repository.AuthRepository
}

func NewAuthHandler(repo *repository.AuthRepository) *AuthHandler {
	return &AuthHandler{repo: repo}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req models.RegisterReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	if err := validate.Struct(req); err != nil {
		http.Error(w, "Validation failed: " + err.Error(), http.StatusBadRequest)
		return
	}

	hash, _ := service.HashPassword(req.Password)
	user := models.User{
		Email: req.Email,
		PasswordHash: hash,
		FullName: req.FullName,
		Phone: req.Phone,
	}

	if err := h.repo.CreateUser(&user); err != nil {
		http.Error(w, "User already exists or registration error", http.StatusConflict)
		return
	}

	token, _ := service.GenerateToken(user.ID, "guest")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(models.AuthResponse{AccessToken: token, User: user})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	if err := validate.Struct(req); err != nil {
		http.Error(w, "Validation failed: " + err.Error(), http.StatusBadRequest)
		return
	}

	user, err := h.repo.GetUserByEmail(req.Email)
	if err != nil || !service.CheckPasswordHash(req.Password, user.PasswordHash) {
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	token, _ := service.GenerateToken(user.ID, user.Role)
	json.NewEncoder(w).Encode(models.AuthResponse{AccessToken: token, User: *user})
}
