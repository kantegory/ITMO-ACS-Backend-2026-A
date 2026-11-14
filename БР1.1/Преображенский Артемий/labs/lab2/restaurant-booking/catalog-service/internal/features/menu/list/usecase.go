package list

import (
	"context"

	"github.com/google/uuid"

	"restaurant-booking/catalog-service/internal/domain"
)

type Repository interface {
	ListByRestaurant(ctx context.Context, restaurantID uuid.UUID, proteinsMin *float64, proteinsMax *float64, fatsMin *float64, fatsMax *float64, carbsMin *float64, carbsMax *float64) ([]domain.Dish, error)
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
	items, err := u.repo.ListByRestaurant(ctx, rid, input.ProteinsMin, input.ProteinsMax, input.FatsMin, input.FatsMax, input.CarbsMin, input.CarbsMax)
	if err != nil {
		return Output{}, err
	}
	return Output{Items: items}, nil
}
