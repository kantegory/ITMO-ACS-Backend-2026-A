package create

import (
	"context"

	"github.com/google/uuid"

	"restaurant-booking/internal/domain"
)

type Repository interface {
	Create(ctx context.Context, userID uuid.UUID, restaurantID uuid.UUID, rating int, text string) (domain.Review, error)
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
	rev, err := u.repo.Create(ctx, input.UserID, rid, input.Rating, input.Text)
	if err != nil {
		return Output{}, err
	}
	return Output{Review: rev}, nil
}
