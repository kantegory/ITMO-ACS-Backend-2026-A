package get

import (
	"context"

	"github.com/google/uuid"

	"restaurant-booking/internal/domain"
)

type Repository interface {
	GetByUserAndID(ctx context.Context, userID uuid.UUID, bookingID uuid.UUID) (domain.Booking, error)
}

type Usecase struct {
	repo Repository
}

func NewUsecase(repo Repository) *Usecase {
	return &Usecase{repo: repo}
}

func (u *Usecase) Get(ctx context.Context, input Input) (Output, error) {
	bid, err := uuid.Parse(input.BookingID)
	if err != nil {
		return Output{}, domain.ErrInvalidInput
	}
	b, err := u.repo.GetByUserAndID(ctx, input.UserID, bid)
	if err != nil {
		return Output{}, err
	}
	return Output{Booking: b}, nil
}
