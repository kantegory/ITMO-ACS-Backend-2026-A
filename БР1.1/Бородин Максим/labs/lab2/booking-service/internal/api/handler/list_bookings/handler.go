package listbookingshandler

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/borodin-maksim/restaurant-booking/booking-service/internal/api"
	"github.com/borodin-maksim/restaurant-booking/booking-service/internal/domain"
	uc "github.com/borodin-maksim/restaurant-booking/booking-service/internal/usecase/list_bookings"
)

type useCase interface {
	List(ctx context.Context, req uc.Request) (*uc.Response, error)
}

type Handler struct {
	uc useCase
}

func New(uc useCase) *Handler {
	return &Handler{uc: uc}
}

type bookingItem struct {
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

func toItem(b *domain.Booking) *bookingItem {
	return &bookingItem{
		ID:          b.ID,
		UserID:      b.UserID,
		TableID:     b.TableID,
		BookedDate:  b.BookedDate,
		TimeFrom:    b.TimeFrom,
		TimeTo:      b.TimeTo,
		GuestsCount: b.GuestsCount,
		Status:      b.Status,
		CreatedAt:   b.CreatedAt,
	}
}

func (h *Handler) Handle(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	limit, _ := strconv.Atoi(q.Get("limit"))
	offset, _ := strconv.Atoi(q.Get("offset"))
	if limit <= 0 {
		limit = 20
	}

	res, err := h.uc.List(r.Context(), uc.Request{
		Status: q.Get("status"),
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		api.MapDomainError(w, err)
		return
	}

	items := make([]*bookingItem, 0, len(res.Items))
	for _, b := range res.Items {
		items = append(items, toItem(b))
	}
	api.RespondJSON(w, http.StatusOK, map[string]any{"items": items, "total": res.Total})
}
