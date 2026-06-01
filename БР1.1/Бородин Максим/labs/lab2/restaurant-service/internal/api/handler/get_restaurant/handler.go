package getrestauranthandler

import (
	"context"
	"net/http"
	"time"

	"github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/api"
	"github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/domain"
	"github.com/go-chi/chi/v5"
)

type useCase interface {
	Get(ctx context.Context, id string) (*domain.Restaurant, error)
	GetMenu(ctx context.Context, restaurantID string) ([]*domain.MenuItem, error)
}

type Handler struct {
	uc useCase
}

func New(uc useCase) *Handler {
	return &Handler{uc: uc}
}

type restaurantResponse struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CuisineType string    `json:"cuisine_type"`
	Location    string    `json:"location"`
	PriceRange  int       `json:"price_range"`
	AvgRating   float64   `json:"avg_rating"`
	Photos      []string  `json:"photos"`
	CreatedAt   time.Time `json:"created_at"`
}

type menuItemResponse struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	Category    string  `json:"category"`
}

func (h *Handler) HandleGet(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	rest, err := h.uc.Get(r.Context(), id)
	if err != nil {
		api.MapDomainError(w, err)
		return
	}

	photos := rest.Photos
	if photos == nil {
		photos = []string{}
	}

	api.RespondJSON(w, http.StatusOK, restaurantResponse{
		ID:          rest.ID,
		Name:        rest.Name,
		Description: rest.Description,
		CuisineType: rest.CuisineType,
		Location:    rest.Location,
		PriceRange:  rest.PriceRange,
		AvgRating:   rest.AvgRating,
		Photos:      photos,
		CreatedAt:   rest.CreatedAt,
	})
}

func (h *Handler) HandleMenu(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	items, err := h.uc.GetMenu(r.Context(), id)
	if err != nil {
		api.MapDomainError(w, err)
		return
	}

	resp := make([]menuItemResponse, 0, len(items))
	for _, m := range items {
		resp = append(resp, menuItemResponse{
			ID:          m.ID,
			Name:        m.Name,
			Description: m.Description,
			Price:       m.Price,
			Category:    m.Category,
		})
	}
	api.RespondJSON(w, http.StatusOK, map[string]any{"items": resp})
}
