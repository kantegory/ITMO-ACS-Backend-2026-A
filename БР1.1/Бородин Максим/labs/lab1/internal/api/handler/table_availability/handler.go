package tableavailabilityhandler

import (
	"context"
	"net/http"
	"strconv"

	"github.com/borodin-maksim/restaurant-booking/internal/api"
	uc "github.com/borodin-maksim/restaurant-booking/internal/usecase/table_availability"
	"github.com/go-chi/chi/v5"
)

type useCase interface {
	GetAvailability(ctx context.Context, req uc.Request) ([]*uc.TableWithAvailability, error)
}

type Handler struct {
	uc useCase
}

func New(uc useCase) *Handler {
	return &Handler{uc: uc}
}

type tableItem struct {
	ID           string `json:"id"`
	RestaurantID string `json:"restaurant_id"`
	TableNumber  int    `json:"table_number"`
	Capacity     int    `json:"capacity"`
	IsAvailable  bool   `json:"is_available"`
}

func (h *Handler) Handle(w http.ResponseWriter, r *http.Request) {
	restaurantID := chi.URLParam(r, "id")
	q := r.URL.Query()
	guests, _ := strconv.Atoi(q.Get("guests"))

	tables, err := h.uc.GetAvailability(r.Context(), uc.Request{
		RestaurantID: restaurantID,
		Date:         q.Get("date"),
		TimeFrom:     q.Get("time_from"),
		TimeTo:       q.Get("time_to"),
		Guests:       guests,
	})
	if err != nil {
		api.MapDomainError(w, err)
		return
	}

	items := make([]tableItem, 0, len(tables))
	for _, t := range tables {
		items = append(items, tableItem{
			ID:           t.ID,
			RestaurantID: t.RestaurantID,
			TableNumber:  t.TableNumber,
			Capacity:     t.Capacity,
			IsAvailable:  t.IsAvailable,
		})
	}
	api.RespondJSON(w, http.StatusOK, map[string]any{"items": items})
}
