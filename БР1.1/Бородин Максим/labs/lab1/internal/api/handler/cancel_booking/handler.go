package cancelbookinghandler

import (
	"context"
	"net/http"
	"time"

	"github.com/borodin-maksim/restaurant-booking/internal/api"
	"github.com/borodin-maksim/restaurant-booking/internal/domain"
	"github.com/borodin-maksim/restaurant-booking/internal/infrastructure/middleware"
	"github.com/go-chi/chi/v5"
)

type useCase interface {
	Cancel(ctx context.Context, bookingID, userID string) (*domain.Booking, error)
}

type Handler struct {
	uc useCase
}

func New(uc useCase) *Handler {
	return &Handler{uc: uc}
}

type response struct {
	ID          string    `json:"id"`
	UserID      string    `json:"user_id"`
	TableID     string    `json:"table_id"`
	BookedDate  string    `json:"booked_date"`
	TimeFrom    string    `json:"time_from"`
	TimeTo      string    `json:"time_to"`
	GuestsCount int       `json:"guests_count"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
}

func (h *Handler) Handle(w http.ResponseWriter, r *http.Request) {
	bookingID := chi.URLParam(r, "id")
	userID := middleware.GetUserID(r.Context())

	b, err := h.uc.Cancel(r.Context(), bookingID, userID)
	if err != nil {
		api.MapDomainError(w, err)
		return
	}

	api.RespondJSON(w, http.StatusOK, response{
		ID:          b.ID,
		UserID:      b.UserID,
		TableID:     b.TableID,
		BookedDate:  b.BookedDate,
		TimeFrom:    b.TimeFrom,
		TimeTo:      b.TimeTo,
		GuestsCount: b.GuestsCount,
		Status:      b.Status,
		CreatedAt:   b.CreatedAt,
	})
}
