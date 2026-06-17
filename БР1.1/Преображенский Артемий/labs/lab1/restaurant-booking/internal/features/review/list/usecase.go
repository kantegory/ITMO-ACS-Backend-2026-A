package list

import (
	"context"

	"github.com/google/uuid"

	"restaurant-booking/internal/domain"
)

type Repository interface {
	ListByRestaurant(ctx context.Context, restaurantID uuid.UUID) ([]Item, error)
}

type Usecase struct {
	repo Repository
}

func NewUsecase(repo Repository) *Usecase {
	return &Usecase{repo: repo}
}

func (u *Usecase) List(ctx context.Context, input Input) (Output, error) {
	rid, err := uuid.Parse(input.RestaurantID)
	if err != nil {
		return Output{}, domain.ErrInvalidInput
	}
	items, err := u.repo.ListByRestaurant(ctx, rid)
	if err != nil {
		return Output{}, err
	}
	return Output{Items: items}, nil
}
