package getprofile

import (
	"context"

	"github.com/borodin-maksim/restaurant-booking/auth-service/internal/domain"
)

type userRepository interface {
	GetByID(ctx context.Context, id string) (*domain.User, error)
}
