package create

import (
	"context"
	"strings"

	"restaurant-booking/internal/domain"
)

type Repository interface {
	Create(ctx context.Context, restaurant domain.Restaurant) (domain.Restaurant, error)
}

type Usecase struct {
	repo Repository
}

func NewUsecase(repo Repository) *Usecase {
	return &Usecase{repo: repo}
}

func (u *Usecase) Create(ctx context.Context, input Input) (Output, error) {
	restaurant := domain.Restaurant{
		Name:          strings.TrimSpace(input.Name),
		Description:   strings.TrimSpace(input.Description),
		City:          domain.City(strings.TrimSpace(string(input.City))),
		Address:       domain.Address(strings.TrimSpace(string(input.Address))),
		CuisineType:   domain.CuisineType(strings.TrimSpace(string(input.CuisineType))),
		PriceCategory: domain.PriceCategory(strings.TrimSpace(string(input.PriceCategory))),
		Photos:        input.Photos,
	}
	if err := restaurant.Validate(); err != nil {
		return Output{}, err
	}
	created, err := u.repo.Create(ctx, restaurant)
	if err != nil {
		return Output{}, err
	}
	return Output{Restaurant: created}, nil
}
