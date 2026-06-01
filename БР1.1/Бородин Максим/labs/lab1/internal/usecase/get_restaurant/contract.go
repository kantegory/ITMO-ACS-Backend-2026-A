package getrestaurant

import (
	"context"

	"github.com/borodin-maksim/restaurant-booking/internal/domain"
)

type restaurantRepository interface {
	GetByID(ctx context.Context, id string) (*domain.Restaurant, error)
}

type menuRepository interface {
	ListMenuByRestaurant(ctx context.Context, restaurantID string) ([]*domain.MenuItem, error)
}
