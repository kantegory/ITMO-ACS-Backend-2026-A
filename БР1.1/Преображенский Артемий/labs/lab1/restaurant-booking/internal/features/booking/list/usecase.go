package list

import (
	"context"

	"github.com/google/uuid"

	"restaurant-booking/internal/domain"
)

type Repository interface {
	ListByUser(ctx context.Context, userID uuid.UUID) ([]domain.Booking, error)
}

type Usecase struct {
	repo Repository
}

func NewUsecase(repo Repository) *Usecase {
	return &Usecase{repo: repo}
}

func (u *Usecase) List(ctx context.Context, input Input) (Output, error) {
	items, err := u.repo.ListByUser(ctx, input.UserID)
	if err != nil {
		return Output{}, err
	}
	return Output{Bookings: items}, nil
}
