package get

import (
	"context"

	"github.com/google/uuid"

	"restaurant-booking/internal/domain"
)

type Repository interface {
	GetByRestaurantAndID(ctx context.Context, restaurantID uuid.UUID, itemID uuid.UUID) (domain.Dish, error)
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
	itemID, err := uuid.Parse(input.ItemID)
	if err != nil {
		return Output{}, domain.ErrInvalidInput
	}
	item, err := u.repo.GetByRestaurantAndID(ctx, rid, itemID)
	if err != nil {
		return Output{}, err
	}
	return Output{Item: item}, nil
}
