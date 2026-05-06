package loginhandler

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/borodin-maksim/restaurant-booking/auth-service/internal/api"
	"github.com/borodin-maksim/restaurant-booking/auth-service/internal/domain"
	uc "github.com/borodin-maksim/restaurant-booking/auth-service/internal/usecase/login"
	"github.com/golang-jwt/jwt/v5"
)

type useCase interface {
	Login(ctx context.Context, req uc.Request) (*domain.User, error)
}

type Handler struct {
	uc        useCase
	jwtSecret string
}

func New(uc useCase, jwtSecret string) *Handler {
	return &Handler{uc: uc, jwtSecret: jwtSecret}
}

type request struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type response struct {
	Token string `json:"token"`
}

func (h *Handler) Handle(w http.ResponseWriter, r *http.Request) {
	var req request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		api.RespondError(w, http.StatusBadRequest, "INVALID_REQUEST", "invalid json")
		return
	}

	u, err := h.uc.Login(r.Context(), uc.Request{
		Email:    req.Email,
		Password: req.Password,
	})
	if err != nil {
		api.MapDomainError(w, err)
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": u.ID,
		"role":    u.Role,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	})

	signed, err := token.SignedString([]byte(h.jwtSecret))
	if err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to sign token")
		return
	}

	api.RespondJSON(w, http.StatusOK, response{Token: signed})
}
