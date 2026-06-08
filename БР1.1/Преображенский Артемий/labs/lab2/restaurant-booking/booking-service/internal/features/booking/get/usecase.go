package get

import (
	"context"

	"github.com/google/uuid"

	"restaurant-booking/booking-service/internal/domain"
)

type Repository interface {
	GetByIDAndUser(ctx context.Context, bookingID uuid.UUID, userID uuid.UUID) (domain.Booking, error)
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
	b, err := u.repo.GetByIDAndUser(ctx, bid, input.UserID)
	if err != nil {
		return Output{}, err
	}
	return Output{Booking: b}, nil
}
