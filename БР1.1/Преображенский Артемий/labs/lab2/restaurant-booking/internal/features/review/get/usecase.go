package get

import (
	"context"

	"github.com/google/uuid"

	"restaurant-booking/internal/domain"
)

type Repository interface {
	GetByRestaurantAndID(ctx context.Context, restaurantID uuid.UUID, reviewID uuid.UUID) (Item, error)
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
	reviewID, err := uuid.Parse(input.ReviewID)
	if err != nil {
		return Output{}, domain.ErrInvalidInput
	}
	it, err := u.repo.GetByRestaurantAndID(ctx, rid, reviewID)
	if err != nil {
		return Output{}, err
	}
	return Output{Item: it}, nil
}
