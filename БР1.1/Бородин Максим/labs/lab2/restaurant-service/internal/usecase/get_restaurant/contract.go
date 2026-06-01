package getrestaurant

import (
	"context"

	"github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/domain"
)

type restaurantRepository interface {
	GetByID(ctx context.Context, id string) (*domain.Restaurant, error)
	ExistsByID(ctx context.Context, id string) (bool, error)
}

type menuRepository interface {
	ListMenuByRestaurant(ctx context.Context, restaurantID string) ([]*domain.MenuItem, error)
}
