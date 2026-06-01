package internaltables

import (
	"context"

	"github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/domain"
)

type UseCase struct {
	tableRepo tableRepository
}

func New(tableRepo tableRepository) *UseCase {
	return &UseCase{tableRepo: tableRepo}
}

func (uc *UseCase) GetTable(ctx context.Context, id string) (*domain.Table, error) {
	return uc.tableRepo.GetByID(ctx, id)
}

func (uc *UseCase) ListTables(ctx context.Context, restaurantID string) ([]*domain.Table, error) {
	return uc.tableRepo.ListByRestaurant(ctx, restaurantID)
}
