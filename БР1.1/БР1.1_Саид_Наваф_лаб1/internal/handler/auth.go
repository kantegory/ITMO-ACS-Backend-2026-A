package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"job-search-api/internal/model"
	"job-search-api/internal/repository"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	repos  *repository.Repositories
	secret string
}

func NewAuthHandler(repos *repository.Repositories, secret string) *AuthHandler {
	return &AuthHandler{repos: repos, secret: secret}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req model.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if req.Role != "applicant" && req.Role != "employer" {
		http.Error(w, "Role must be applicant or employer", http.StatusBadRequest)
		return
	}

	_, err := h.repos.Users.GetByEmail(r.Context(), req.Email)
	if err == nil {
		http.Error(w, "User already exists", http.StatusConflict)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	user, err := h.repos.Users.Create(r.Context(), req.Email, req.Phone, req.Role, string(hashedPassword))
	if err != nil {
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

	token, err := h.generateToken(user.ID, user.Email, user.Role)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(model.AuthResponse{
		Token: token,
		User: model.User{
			ID:           user.ID,
			Email:        user.Email,
			Phone:        user.Phone,
			Role:         user.Role,
			RegisteredAt: user.RegisteredAt,
		},
	})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req model.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	user, err := h.repos.Users.GetByEmail(r.Context(), req.Email)
	if err != nil {
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil {
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	token, err := h.generateToken(user.ID, user.Email, user.Role)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(model.AuthResponse{
		Token: token,
		User: model.User{
			ID:           user.ID,
			Email:        user.Email,
			Phone:        user.Phone,
			Role:         user.Role,
			RegisteredAt: user.RegisteredAt,
		},
	})
}

func (h *AuthHandler) generateToken(id int, email, role string) (string, error) {
	claims := jwt.MapClaims{
		"user_id": id,
		"email":   email,
		"role":    role,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(h.secret))
}