package registerhandler

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/borodin-maksim/restaurant-booking/auth-service/internal/api"
	"github.com/borodin-maksim/restaurant-booking/auth-service/internal/domain"
	uc "github.com/borodin-maksim/restaurant-booking/auth-service/internal/usecase/register"
)

type useCase interface {
	Register(ctx context.Context, req uc.Request) (*domain.User, error)
}

type Handler struct {
	uc useCase
}

func New(uc useCase) *Handler {
	return &Handler{uc: uc}
}

type request struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type response struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

func (h *Handler) Handle(w http.ResponseWriter, r *http.Request) {
	var req request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		api.RespondError(w, http.StatusBadRequest, "INVALID_REQUEST", "invalid json")
		return
	}

	u, err := h.uc.Register(r.Context(), uc.Request{
		Email:    req.Email,
		Password: req.Password,
	})
	if err != nil {
		api.MapDomainError(w, err)
		return
	}

	api.RespondJSON(w, http.StatusCreated, response{
		ID:        u.ID,
		Email:     u.Email,
		Role:      u.Role,
		CreatedAt: u.CreatedAt,
	})
}
