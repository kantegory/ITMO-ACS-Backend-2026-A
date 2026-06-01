package listreviews

import (
	"context"

	"github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/domain"
)

type reviewRepository interface {
	ListByRestaurant(ctx context.Context, restaurantID string, limit, offset int) ([]*domain.Review, int, error)
}

type restaurantRepository interface {
	ExistsByID(ctx context.Context, id string) (bool, error)
}
