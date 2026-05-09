package createbookinghandler

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/borodin-maksim/restaurant-booking/booking-service/internal/api"
	"github.com/borodin-maksim/restaurant-booking/booking-service/internal/domain"
	"github.com/borodin-maksim/restaurant-booking/booking-service/internal/infrastructure/middleware"
	uc "github.com/borodin-maksim/restaurant-booking/booking-service/internal/usecase/create_booking"
)

type useCase interface {
	Create(ctx context.Context, req uc.Request) (*domain.Booking, error)
}

type Handler struct {
	uc useCase
}

func New(uc useCase) *Handler {
	return &Handler{uc: uc}
}

type request struct {
	TableID     string `json:"table_id"`
	BookedDate  string `json:"booked_date"`
	TimeFrom    string `json:"time_from"`
	TimeTo      string `json:"time_to"`
	GuestsCount int    `json:"guests_count"`
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
	userID := middleware.GetUserID(r.Context())

	var req request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		api.RespondError(w, http.StatusBadRequest, "INVALID_REQUEST", "invalid json")
		return
	}

	b, err := h.uc.Create(r.Context(), uc.Request{
		UserID:      userID,
		TableID:     req.TableID,
		BookedDate:  req.BookedDate,
		TimeFrom:    req.TimeFrom,
		TimeTo:      req.TimeTo,
		GuestsCount: req.GuestsCount,
	})
	if err != nil {
		api.MapDomainError(w, err)
		return
	}

	api.RespondJSON(w, http.StatusCreated, response{
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
