package internalgettable

import (
	"context"

	"github.com/google/uuid"
)

type Repository interface {
	GetByRestaurantAndID(ctx context.Context, restaurantID uuid.UUID, tableID uuid.UUID) (Table, error)
}

type Usecase struct {
	repo Repository
}

func NewUsecase(repo Repository) *Usecase {
	return &Usecase{repo: repo}
}

func (u *Usecase) Get(ctx context.Context, input Input) (Output, error) {
	t, err := u.repo.GetByRestaurantAndID(ctx, input.RestaurantID, input.TableID)
	if err != nil {
		return Output{}, err
	}
	return Output{Table: t}, nil
}
