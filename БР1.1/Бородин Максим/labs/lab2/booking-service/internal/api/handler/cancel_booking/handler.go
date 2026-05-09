package cancelbookinghandler

import (
	"context"
	"net/http"

	"github.com/borodin-maksim/restaurant-booking/booking-service/internal/api"
	"github.com/borodin-maksim/restaurant-booking/booking-service/internal/infrastructure/middleware"
	"github.com/go-chi/chi/v5"
)

type useCase interface {
	Cancel(ctx context.Context, bookingID, userID string) error
}

type Handler struct {
	uc useCase
}

func New(uc useCase) *Handler {
	return &Handler{uc: uc}
}

func (h *Handler) Handle(w http.ResponseWriter, r *http.Request) {
	bookingID := chi.URLParam(r, "id")
	userID := middleware.GetUserID(r.Context())

	if err := h.uc.Cancel(r.Context(), bookingID, userID); err != nil {
		api.MapDomainError(w, err)
		return
	}

	api.RespondJSON(w, http.StatusOK, map[string]string{"status": "cancelled"})
}
