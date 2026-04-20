package createtable

import (
	"context"

	"github.com/borodin-maksim/restaurant-booking/internal/domain"
)

type tableRepository interface {
	Create(ctx context.Context, t *domain.Table) error
}

type restaurantRepository interface {
	ExistsByID(ctx context.Context, id string) (bool, error)
}
