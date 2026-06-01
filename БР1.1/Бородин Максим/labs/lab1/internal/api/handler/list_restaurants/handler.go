package listrestaurantshandler

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/borodin-maksim/restaurant-booking/internal/api"
	"github.com/borodin-maksim/restaurant-booking/internal/domain"
	uc "github.com/borodin-maksim/restaurant-booking/internal/usecase/list_restaurants"
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

type restaurantItem struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	CuisineType string    `json:"cuisine_type"`
	Location    string    `json:"location"`
	PriceRange  int       `json:"price_range"`
	AvgRating   float64   `json:"avg_rating"`
	CreatedAt   time.Time `json:"created_at"`
}

type listResponse struct {
	Items []*restaurantItem `json:"items"`
	Total int               `json:"total"`
}

func toItem(r *domain.Restaurant) *restaurantItem {
	return &restaurantItem{
		ID:          r.ID,
		Name:        r.Name,
		CuisineType: r.CuisineType,
		Location:    r.Location,
		PriceRange:  r.PriceRange,
		AvgRating:   r.AvgRating,
		CreatedAt:   r.CreatedAt,
	}
}

func (h *Handler) Handle(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	priceRange, _ := strconv.Atoi(q.Get("price_range"))
	limit, _ := strconv.Atoi(q.Get("limit"))
	offset, _ := strconv.Atoi(q.Get("offset"))
	if limit <= 0 {
		limit = 20
	}

	res, err := h.uc.List(r.Context(), uc.Request{
		Cuisine:    q.Get("cuisine"),
		Location:   q.Get("location"),
		PriceRange: priceRange,
		Search:     q.Get("search"),
		Limit:      limit,
		Offset:     offset,
	})
	if err != nil {
		api.MapDomainError(w, err)
		return
	}

	items := make([]*restaurantItem, 0, len(res.Items))
	for _, rest := range res.Items {
		items = append(items, toItem(rest))
	}
	api.RespondJSON(w, http.StatusOK, listResponse{Items: items, Total: res.Total})
}
