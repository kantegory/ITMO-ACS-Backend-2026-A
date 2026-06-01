package createtablehandler

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/api"
	"github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/domain"
	uc "github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/usecase/create_table"
	"github.com/go-chi/chi/v5"
)

type useCase interface {
	Create(ctx context.Context, req uc.Request) (*domain.Table, error)
}

type Handler struct {
	uc useCase
}

func New(uc useCase) *Handler {
	return &Handler{uc: uc}
}

type request struct {
	TableNumber int `json:"table_number"`
	Capacity    int `json:"capacity"`
}

type response struct {
	ID           string `json:"id"`
	RestaurantID string `json:"restaurant_id"`
	TableNumber  int    `json:"table_number"`
	Capacity     int    `json:"capacity"`
}

func (h *Handler) Handle(w http.ResponseWriter, r *http.Request) {
	restaurantID := chi.URLParam(r, "id")

	var req request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		api.RespondError(w, http.StatusBadRequest, "INVALID_REQUEST", "invalid json")
		return
	}

	t, err := h.uc.Create(r.Context(), uc.Request{
		RestaurantID: restaurantID,
		TableNumber:  req.TableNumber,
		Capacity:     req.Capacity,
	})
	if err != nil {
		api.MapDomainError(w, err)
		return
	}

	api.RespondJSON(w, http.StatusCreated, response{
		ID:           t.ID,
		RestaurantID: t.RestaurantID,
		TableNumber:  t.TableNumber,
		Capacity:     t.Capacity,
	})
}
