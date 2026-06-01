package internaltables

import (
	"context"

	"github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/domain"
)

type tableRepository interface {
	GetByID(ctx context.Context, id string) (*domain.Table, error)
	ListByRestaurant(ctx context.Context, restaurantID string) ([]*domain.Table, error)
}
