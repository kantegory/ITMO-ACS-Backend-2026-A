package getprofile

import (
	"context"

	"github.com/borodin-maksim/restaurant-booking/internal/domain"
)

type userRepository interface {
	GetByID(ctx context.Context, id string) (*domain.User, error)
}
