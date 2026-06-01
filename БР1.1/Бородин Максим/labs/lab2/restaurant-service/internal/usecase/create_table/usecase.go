package createtable

import (
	"context"

	"github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/domain"
	"github.com/google/uuid"
)

type Request struct {
	RestaurantID string
	TableNumber  int
	Capacity     int
}

type UseCase struct {
	tableRepo      tableRepository
	restaurantRepo restaurantRepository
}

func New(tableRepo tableRepository, restaurantRepo restaurantRepository) *UseCase {
	return &UseCase{tableRepo: tableRepo, restaurantRepo: restaurantRepo}
}

func (uc *UseCase) Create(ctx context.Context, req Request) (*domain.Table, error) {
	if req.TableNumber <= 0 || req.Capacity <= 0 {
		return nil, domain.ErrInvalidRequest
	}

	exists, err := uc.restaurantRepo.ExistsByID(ctx, req.RestaurantID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, domain.ErrNotFound
	}

	t := &domain.Table{
		ID:           uuid.New().String(),
		RestaurantID: req.RestaurantID,
		TableNumber:  req.TableNumber,
		Capacity:     req.Capacity,
	}

	if err := uc.tableRepo.Create(ctx, t); err != nil {
		return nil, err
	}
	return t, nil
}
