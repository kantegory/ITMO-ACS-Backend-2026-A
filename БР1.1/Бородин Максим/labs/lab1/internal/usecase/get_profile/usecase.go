package getprofile

import (
	"context"

	"github.com/borodin-maksim/restaurant-booking/internal/domain"
)

type UseCase struct {
	userRepo userRepository
}

func New(userRepo userRepository) *UseCase {
	return &UseCase{userRepo: userRepo}
}

func (uc *UseCase) GetProfile(ctx context.Context, userID string) (*domain.User, error) {
	return uc.userRepo.GetByID(ctx, userID)
}
