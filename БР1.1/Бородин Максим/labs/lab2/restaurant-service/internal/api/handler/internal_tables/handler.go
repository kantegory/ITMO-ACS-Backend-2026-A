package internaltableshandler

import (
	"context"
	"net/http"

	"github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/api"
	"github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/domain"
	"github.com/go-chi/chi/v5"
)

type useCase interface {
	GetTable(ctx context.Context, id string) (*domain.Table, error)
	ListTables(ctx context.Context, restaurantID string) ([]*domain.Table, error)
}

type Handler struct {
	uc useCase
}

func New(uc useCase) *Handler {
	return &Handler{uc: uc}
}

type tableInfo struct {
	ID           string `json:"id"`
	RestaurantID string `json:"restaurant_id"`
	TableNumber  int    `json:"table_number"`
	Capacity     int    `json:"capacity"`
}

func toTableInfo(t *domain.Table) tableInfo {
	return tableInfo{
		ID:           t.ID,
		RestaurantID: t.RestaurantID,
		TableNumber:  t.TableNumber,
		Capacity:     t.Capacity,
	}
}

func (h *Handler) HandleGetTable(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	t, err := h.uc.GetTable(r.Context(), id)
	if err != nil {
		api.MapDomainError(w, err)
		return
	}
	api.RespondJSON(w, http.StatusOK, toTableInfo(t))
}

func (h *Handler) HandleListTables(w http.ResponseWriter, r *http.Request) {
	restaurantID := chi.URLParam(r, "id")
	tables, err := h.uc.ListTables(r.Context(), restaurantID)
	if err != nil {
		api.MapDomainError(w, err)
		return
	}

	result := make([]tableInfo, 0, len(tables))
	for _, t := range tables {
		result = append(result, toTableInfo(t))
	}
	api.RespondJSON(w, http.StatusOK, map[string]any{"tables": result})
}
