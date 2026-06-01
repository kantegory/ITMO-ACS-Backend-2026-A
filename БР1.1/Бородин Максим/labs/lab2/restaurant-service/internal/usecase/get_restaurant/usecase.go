package getrestaurant

import (
	"context"
	"errors"

	"github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/domain"
)

type UseCase struct {
	restaurantRepo restaurantRepository
	menuRepo       menuRepository
}

func New(restaurantRepo restaurantRepository, menuRepo menuRepository) *UseCase {
	return &UseCase{restaurantRepo: restaurantRepo, menuRepo: menuRepo}
}

func (uc *UseCase) Get(ctx context.Context, id string) (*domain.Restaurant, error) {
	return uc.restaurantRepo.GetByID(ctx, id)
}

func (uc *UseCase) GetMenu(ctx context.Context, restaurantID string) ([]*domain.MenuItem, error) {
	exists, err := uc.restaurantExists(ctx, restaurantID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, domain.ErrNotFound
	}
	return uc.menuRepo.ListMenuByRestaurant(ctx, restaurantID)
}

func (uc *UseCase) restaurantExists(ctx context.Context, id string) (bool, error) {
	_, err := uc.restaurantRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}
