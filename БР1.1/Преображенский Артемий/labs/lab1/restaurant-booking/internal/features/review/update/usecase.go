package update

import (
	"context"
	"strings"

	"github.com/google/uuid"

	"restaurant-booking/internal/domain"
)

type Repository interface {
	Update(ctx context.Context, review domain.Review) (domain.Review, error)
}

type Usecase struct {
	repo Repository
}

func NewUsecase(repo Repository) *Usecase {
	return &Usecase{repo: repo}
}

func (u *Usecase) Update(ctx context.Context, input Input) (Output, error) {
	rid, err := uuid.Parse(input.RestaurantID)
	if err != nil {
		return Output{}, domain.ErrInvalidInput
	}
	reviewID, err := uuid.Parse(input.ReviewID)
	if err != nil {
		return Output{}, domain.ErrInvalidInput
	}
	review := domain.Review{
		ID:           reviewID,
		UserID:       input.UserID,
		RestaurantID: rid,
		Rating:       domain.Rating(input.Rating),
		Text:         strings.TrimSpace(input.Text),
	}
	if err := review.Validate(); err != nil {
		return Output{}, err
	}
	updated, err := u.repo.Update(ctx, review)
	if err != nil {
		return Output{}, err
	}
	return Output{Review: updated}, nil
}
