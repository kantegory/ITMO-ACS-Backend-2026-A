package create

import (
	"context"

	"github.com/google/uuid"

	"restaurant-booking/catalog-service/internal/domain"
)

type Repository interface {
	Create(ctx context.Context, table domain.Table) (domain.Table, error)
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
	table := domain.Table{
		RestaurantID: rid,
		Number:       input.Number,
		Seats:        input.Seats,
	}
	if err := table.Validate(); err != nil {
		return Output{}, err
	}
	created, err := u.repo.Create(ctx, table)
	if err != nil {
		return Output{}, err
	}
	return Output{Table: created}, nil
}
