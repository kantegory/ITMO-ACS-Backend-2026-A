package addreviewhandler

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/borodin-maksim/restaurant-booking/internal/api"
	"github.com/borodin-maksim/restaurant-booking/internal/domain"
	"github.com/borodin-maksim/restaurant-booking/internal/infrastructure/middleware"
	uc "github.com/borodin-maksim/restaurant-booking/internal/usecase/add_review"
	"github.com/go-chi/chi/v5"
)

type useCase interface {
	Add(ctx context.Context, req uc.Request) (*domain.Review, error)
}

type Handler struct {
	uc useCase
}

func New(uc useCase) *Handler {
	return &Handler{uc: uc}
}

type request struct {
	Rating  int    `json:"rating"`
	Comment string `json:"comment"`
}

type response struct {
	ID           string    `json:"id"`
	UserID       string    `json:"user_id"`
	RestaurantID string    `json:"restaurant_id"`
	Rating       int       `json:"rating"`
	Comment      string    `json:"comment"`
	CreatedAt    time.Time `json:"created_at"`
}

func (h *Handler) Handle(w http.ResponseWriter, r *http.Request) {
	restaurantID := chi.URLParam(r, "id")
	userID := middleware.GetUserID(r.Context())

	var req request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		api.RespondError(w, http.StatusBadRequest, "INVALID_REQUEST", "invalid json")
		return
	}

	rv, err := h.uc.Add(r.Context(), uc.Request{
		UserID:       userID,
		RestaurantID: restaurantID,
		Rating:       req.Rating,
		Comment:      req.Comment,
	})
	if err != nil {
		api.MapDomainError(w, err)
		return
	}

	api.RespondJSON(w, http.StatusCreated, response{
		ID:           rv.ID,
		UserID:       rv.UserID,
		RestaurantID: rv.RestaurantID,
		Rating:       rv.Rating,
		Comment:      rv.Comment,
		CreatedAt:    rv.CreatedAt,
	})
}
