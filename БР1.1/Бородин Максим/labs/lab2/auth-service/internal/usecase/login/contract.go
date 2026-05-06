package login

import (
	"context"

	"github.com/borodin-maksim/restaurant-booking/auth-service/internal/domain"
)

type userRepository interface {
	GetByEmail(ctx context.Context, email string) (*domain.User, error)
}
