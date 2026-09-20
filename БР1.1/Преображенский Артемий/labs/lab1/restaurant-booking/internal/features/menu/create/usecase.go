package create

import (
	"context"
	"strings"

	"github.com/google/uuid"

	"restaurant-booking/internal/domain"
)

type Repository interface {
	Create(ctx context.Context, item domain.Dish) (domain.Dish, error)
}

type Usecase struct {
	repo Repository
}

func NewUsecase(repo Repository) *Usecase {
	return &Usecase{repo: repo}
}

func (u *Usecase) Create(ctx context.Context, input Input) (Output, error) {
	rid, err := uuid.Parse(input.RestaurantID)
	if err != nil {
		return Output{}, domain.ErrInvalidInput
	}
	item := domain.Dish{
		RestaurantID: rid,
		Name:         strings.TrimSpace(input.Name),
		Description:  strings.TrimSpace(input.Description),
		Price:        domain.Price(input.Price),
		Category:     domain.Category(strings.TrimSpace(input.Category)),
		IsAvailable:  input.IsAvailable,
		Proteins:     input.Proteins,
		Fats:         input.Fats,
		Carbs:        input.Carbs,
	}
	if err := item.Validate(); err != nil {
		return Output{}, err
	}
	created, err := u.repo.Create(ctx, item)
	if err != nil {
		return Output{}, err
	}
	return Output{Item: created}, nil
}
