package createrestauranthandler

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/borodin-maksim/restaurant-booking/internal/api"
	"github.com/borodin-maksim/restaurant-booking/internal/domain"
	uc "github.com/borodin-maksim/restaurant-booking/internal/usecase/create_restaurant"
)

type useCase interface {
	Create(ctx context.Context, req uc.Request) (*domain.Restaurant, error)
}

type Handler struct {
	uc useCase
}

func New(uc useCase) *Handler {
	return &Handler{uc: uc}
}

type request struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	CuisineType string `json:"cuisine_type"`
	Location    string `json:"location"`
	PriceRange  int    `json:"price_range"`
}

type response struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CuisineType string    `json:"cuisine_type"`
	Location    string    `json:"location"`
	PriceRange  int       `json:"price_range"`
	CreatedAt   time.Time `json:"created_at"`
}

func (h *Handler) Handle(w http.ResponseWriter, r *http.Request) {
	var req request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		api.RespondError(w, http.StatusBadRequest, "INVALID_REQUEST", "invalid json")
		return
	}

	rest, err := h.uc.Create(r.Context(), uc.Request{
		Name:        req.Name,
		Description: req.Description,
		CuisineType: req.CuisineType,
		Location:    req.Location,
		PriceRange:  req.PriceRange,
	})
	if err != nil {
		api.MapDomainError(w, err)
		return
	}

	api.RespondJSON(w, http.StatusCreated, response{
		ID:          rest.ID,
		Name:        rest.Name,
		Description: rest.Description,
		CuisineType: rest.CuisineType,
		Location:    rest.Location,
		PriceRange:  rest.PriceRange,
		CreatedAt:   rest.CreatedAt,
	})
}
