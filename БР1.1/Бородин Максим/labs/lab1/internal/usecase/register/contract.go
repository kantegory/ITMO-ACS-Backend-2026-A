package register

import (
	"context"

	"github.com/borodin-maksim/restaurant-booking/internal/domain"
)

type userRepository interface {
	Create(ctx context.Context, u *domain.User) error
}
