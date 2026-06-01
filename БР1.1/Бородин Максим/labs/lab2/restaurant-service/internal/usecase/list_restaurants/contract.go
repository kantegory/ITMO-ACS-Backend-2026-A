package listrestaurants

import (
	"context"

	"github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/domain"
	restaurantrepo "github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/infrastructure/database/restaurant"
)

type restaurantRepository interface {
	List(ctx context.Context, f restaurantrepo.Filter) ([]*domain.Restaurant, int, error)
}
