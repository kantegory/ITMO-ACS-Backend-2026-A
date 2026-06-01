package listrestaurants

import (
	"context"

	"github.com/borodin-maksim/restaurant-booking/internal/domain"
	restaurantrepo "github.com/borodin-maksim/restaurant-booking/internal/infrastructure/database/restaurant"
)

type Request struct {
	Cuisine    string
	Location   string
	PriceRange int
	Search     string
	Limit      int
	Offset     int
}

type Response struct {
	Items []*domain.Restaurant
	Total int
}

type UseCase struct {
	restaurantRepo restaurantRepository
}

func New(restaurantRepo restaurantRepository) *UseCase {
	return &UseCase{restaurantRepo: restaurantRepo}
}

func (uc *UseCase) List(ctx context.Context, req Request) (*Response, error) {
	items, total, err := uc.restaurantRepo.List(ctx, restaurantrepo.Filter{
		Cuisine:    req.Cuisine,
		Location:   req.Location,
		PriceRange: req.PriceRange,
		Search:     req.Search,
		Limit:      req.Limit,
		Offset:     req.Offset,
	})
	if err != nil {
		return nil, err
	}
	return &Response{Items: items, Total: total}, nil
}
