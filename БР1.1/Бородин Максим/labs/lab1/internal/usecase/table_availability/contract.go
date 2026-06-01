package tableavailability

import (
	"context"

	"github.com/borodin-maksim/restaurant-booking/internal/domain"
)

type tableRepository interface {
	ListByRestaurant(ctx context.Context, restaurantID string) ([]*domain.Table, error)
	GetBookedTableIDs(ctx context.Context, restaurantID, date, timeFrom, timeTo string) (map[string]bool, error)
}

type restaurantRepository interface {
	ExistsByID(ctx context.Context, id string) (bool, error)
}
