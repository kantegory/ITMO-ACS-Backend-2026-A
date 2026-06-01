package listreviews

import (
	"context"

	"github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/domain"
)

type Request struct {
	RestaurantID string
	Limit        int
	Offset       int
}

type Response struct {
	Items []*domain.Review
	Total int
}

type UseCase struct {
	reviewRepo     reviewRepository
	restaurantRepo restaurantRepository
}

func New(reviewRepo reviewRepository, restaurantRepo restaurantRepository) *UseCase {
	return &UseCase{reviewRepo: reviewRepo, restaurantRepo: restaurantRepo}
}

func (uc *UseCase) List(ctx context.Context, req Request) (*Response, error) {
	exists, err := uc.restaurantRepo.ExistsByID(ctx, req.RestaurantID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, domain.ErrNotFound
	}

	items, total, err := uc.reviewRepo.ListByRestaurant(ctx, req.RestaurantID, req.Limit, req.Offset)
	if err != nil {
		return nil, err
	}
	return &Response{Items: items, Total: total}, nil
}
