package get

import (
	"context"

	"github.com/google/uuid"

	"restaurant-booking/catalog-service/internal/domain"
)

type Repository interface {
	GetByRestaurantAndID(ctx context.Context, restaurantID uuid.UUID, tableID uuid.UUID) (domain.Table, error)
}

type Usecase struct {
	repo Repository
}

func NewUsecase(repo Repository) *Usecase {
	return &Usecase{repo: repo}
}

func (u *Usecase) Get(ctx context.Context, input Input) (Output, error) {
	rid, err := uuid.Parse(input.RestaurantID)
	if err != nil {
		return Output{}, domain.ErrInvalidInput
	}
	tableID, err := uuid.Parse(input.TableID)
	if err != nil {
		return Output{}, domain.ErrInvalidInput
	}
	t, err := u.repo.GetByRestaurantAndID(ctx, rid, tableID)
	if err != nil {
		return Output{}, err
	}
	return Output{Table: t}, nil
}
