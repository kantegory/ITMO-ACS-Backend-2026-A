package tableavailabilityhandler

import (
	"context"
	"net/http"
	"strconv"

	"github.com/borodin-maksim/restaurant-booking/booking-service/internal/api"
	uc "github.com/borodin-maksim/restaurant-booking/booking-service/internal/usecase/table_availability"
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

func (h *Handler) Handle(w http.ResponseWriter, r *http.Request) {
	restaurantID := chi.URLParam(r, "id")
	q := r.URL.Query()
	guests, _ := strconv.Atoi(q.Get("guests"))

	res, err := h.uc.GetAvailability(r.Context(), uc.Request{
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

	if res == nil {
		res = []*uc.TableWithAvailability{}
	}
	api.RespondJSON(w, http.StatusOK, map[string]any{"tables": res})
}
