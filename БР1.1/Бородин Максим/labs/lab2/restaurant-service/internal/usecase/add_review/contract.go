package addreview

import (
	"context"

	"github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/domain"
)

type reviewRepository interface {
	Create(ctx context.Context, rv *domain.Review) error
	ExistsByUserAndRestaurant(ctx context.Context, userID, restaurantID string) (bool, error)
}

type restaurantRepository interface {
	ExistsByID(ctx context.Context, id string) (bool, error)
}
