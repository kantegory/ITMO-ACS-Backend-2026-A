package delete

import (
	"context"

	"github.com/google/uuid"

	"restaurant-booking/catalog-service/internal/domain"
)

type Repository interface {
	Delete(ctx context.Context, restaurantID uuid.UUID, tableID uuid.UUID) error
}

type Usecase struct {
	repo Repository
}

func NewUsecase(repo Repository) *Usecase {
	return &Usecase{repo: repo}
}

func (u *Usecase) Delete(ctx context.Context, input Input) error {
	rid, err := uuid.Parse(input.RestaurantID)
	if err != nil {
		return domain.ErrInvalidInput
	}
	tableID, err := uuid.Parse(input.TableID)
	if err != nil {
		return domain.ErrInvalidInput
	}
	return u.repo.Delete(ctx, rid, tableID)
}
