package profilehandler

import (
	"context"
	"net/http"
	"time"

	"github.com/borodin-maksim/restaurant-booking/auth-service/internal/api"
	"github.com/borodin-maksim/restaurant-booking/auth-service/internal/domain"
	"github.com/borodin-maksim/restaurant-booking/auth-service/internal/infrastructure/middleware"
)

type useCase interface {
	GetProfile(ctx context.Context, userID string) (*domain.User, error)
}

type Handler struct {
	uc useCase
}

func New(uc useCase) *Handler {
	return &Handler{uc: uc}
}

type response struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

func (h *Handler) Handle(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		api.RespondError(w, http.StatusUnauthorized, "UNAUTHORIZED", "missing user identity")
		return
	}

	u, err := h.uc.GetProfile(r.Context(), userID)
	if err != nil {
		api.MapDomainError(w, err)
		return
	}

	api.RespondJSON(w, http.StatusOK, response{
		ID:        u.ID,
		Email:     u.Email,
		Role:      u.Role,
		CreatedAt: u.CreatedAt,
	})
}
