package delete

import (
	"context"

	"github.com/google/uuid"

	"restaurant-booking/internal/domain"
)

type Repository interface {
	Delete(ctx context.Context, userID uuid.UUID, restaurantID uuid.UUID, reviewID uuid.UUID) error
}

type Usecase struct {
	repo Repository
}

func NewUsecase(repo Repository) *Usecase {
	return &Usecase{repo: repo}
}

func (u *Usecase) Delete(ctx context.Context, input Input) error {
	rid, err := uuid.Parse(input.RestaurantID)
	if err != nil {
		return domain.ErrInvalidInput
	}
	reviewID, err := uuid.Parse(input.ReviewID)
	if err != nil {
		return domain.ErrInvalidInput
	}
	return u.repo.Delete(ctx, input.UserID, rid, reviewID)
}
