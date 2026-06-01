package cancelbookinghandler

import (
	"context"
	"net/http"

	"github.com/borodin-maksim/restaurant-booking/booking-service/internal/api"
	"github.com/borodin-maksim/restaurant-booking/booking-service/internal/infrastructure/kafka"
	"github.com/borodin-maksim/restaurant-booking/booking-service/internal/infrastructure/middleware"
	"github.com/go-chi/chi/v5"
)

type useCase interface {
	Cancel(ctx context.Context, bookingID, userID string) error
}

type Handler struct {
	uc       useCase
	notifier kafka.Notifier
}

func New(uc useCase, notifier kafka.Notifier) *Handler {
	return &Handler{uc: uc, notifier: notifier}
}

func (h *Handler) Handle(w http.ResponseWriter, r *http.Request) {
	bookingID := chi.URLParam(r, "id")
	userID := middleware.GetUserID(r.Context())

	if err := h.uc.Cancel(r.Context(), bookingID, userID); err != nil {
		api.MapDomainError(w, err)
		return
	}

	_ = h.notifier.NotifyBookingCancelled(r.Context(), kafka.BookingEvent{BookingID: bookingID})
	api.RespondJSON(w, http.StatusOK, map[string]string{"status": "cancelled"})
}
