package list

import (
	"context"
	"fmt"

	"restaurant-booking/internal/domain"
)

type Repository interface {
	List(ctx context.Context, input Input) ([]domain.Restaurant, error)
}

type Usecase struct {
	repo Repository
}

func NewUsecase(repo Repository) *Usecase {
	return &Usecase{repo: repo}
}

func (u *Usecase) List(ctx context.Context, input Input) (Output, error) {
	items, err := u.repo.List(ctx, input)
	if err != nil {
		return Output{}, fmt.Errorf("list restaurants: %w", err)
	}

	return Output{Restaurants: items}, nil
}
