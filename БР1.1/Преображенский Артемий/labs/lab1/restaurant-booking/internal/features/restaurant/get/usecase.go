package get

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"restaurant-booking/internal/domain"
)

type Repository interface {
	Get(ctx context.Context, id uuid.UUID) (domain.Restaurant, error)
}

type Usecase struct {
	repo Repository
}

func NewUsecase(repo Repository) *Usecase {
	return &Usecase{repo: repo}
}

func (u *Usecase) Get(ctx context.Context, input Input) (Output, error) {
	restaurantID, err := uuid.Parse(input.ID)
	if err != nil {
		return Output{}, domain.ErrInvalidInput
	}

	restaurant, err := u.repo.Get(ctx, restaurantID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Output{}, domain.ErrNotFound
		}
		return Output{}, err
	}

	return Output{Restaurant: restaurant}, nil
}
