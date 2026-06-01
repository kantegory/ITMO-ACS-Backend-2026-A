package listreviewshandler

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/borodin-maksim/restaurant-booking/internal/api"
	"github.com/borodin-maksim/restaurant-booking/internal/domain"
	uc "github.com/borodin-maksim/restaurant-booking/internal/usecase/list_reviews"
	"github.com/go-chi/chi/v5"
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

type reviewItem struct {
	ID           string    `json:"id"`
	UserID       string    `json:"user_id"`
	RestaurantID string    `json:"restaurant_id"`
	Rating       int       `json:"rating"`
	Comment      string    `json:"comment"`
	CreatedAt    time.Time `json:"created_at"`
}

func toItem(rv *domain.Review) reviewItem {
	return reviewItem{
		ID:           rv.ID,
		UserID:       rv.UserID,
		RestaurantID: rv.RestaurantID,
		Rating:       rv.Rating,
		Comment:      rv.Comment,
		CreatedAt:    rv.CreatedAt,
	}
}

func (h *Handler) Handle(w http.ResponseWriter, r *http.Request) {
	restaurantID := chi.URLParam(r, "id")
	q := r.URL.Query()
	limit, _ := strconv.Atoi(q.Get("limit"))
	offset, _ := strconv.Atoi(q.Get("offset"))
	if limit <= 0 {
		limit = 20
	}

	res, err := h.uc.List(r.Context(), uc.Request{
		RestaurantID: restaurantID,
		Limit:        limit,
		Offset:       offset,
	})
	if err != nil {
		api.MapDomainError(w, err)
		return
	}

	items := make([]reviewItem, 0, len(res.Items))
	for _, rv := range res.Items {
		items = append(items, toItem(rv))
	}
	api.RespondJSON(w, http.StatusOK, map[string]any{"items": items, "total": res.Total})
}
