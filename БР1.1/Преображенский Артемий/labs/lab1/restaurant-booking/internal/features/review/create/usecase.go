package create

import (
	"context"
	"strings"

	"github.com/google/uuid"

	"restaurant-booking/internal/domain"
)

type Repository interface {
	Create(ctx context.Context, review domain.Review) (domain.Review, error)
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
	review := domain.Review{
		UserID:       input.UserID,
		RestaurantID: rid,
		Rating:       domain.Rating(input.Rating),
		Text:         strings.TrimSpace(input.Text),
	}
	if err := review.Validate(); err != nil {
		return Output{}, err
	}
	created, err := u.repo.Create(ctx, review)
	if err != nil {
		return Output{}, err
	}
	return Output{Review: created}, nil
}
