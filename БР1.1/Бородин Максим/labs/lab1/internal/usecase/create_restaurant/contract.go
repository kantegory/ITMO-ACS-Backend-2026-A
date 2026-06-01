package createrestaurant

import (
	"context"

	"github.com/borodin-maksim/restaurant-booking/internal/domain"
)

type restaurantRepository interface {
	Create(ctx context.Context, rest *domain.Restaurant) error
}
