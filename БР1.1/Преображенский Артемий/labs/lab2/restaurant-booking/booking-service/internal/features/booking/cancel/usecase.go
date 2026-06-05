package cancel

import (
	"context"

	"github.com/google/uuid"

	"restaurant-booking/booking-service/internal/domain"
)

type Repository interface {
	Cancel(ctx context.Context, bookingID uuid.UUID, userID uuid.UUID) error
}

type Usecase struct {
	repo Repository
}

func NewUsecase(repo Repository) *Usecase {
	return &Usecase{repo: repo}
}

func (u *Usecase) Cancel(ctx context.Context, input Input) error {
	bid, err := uuid.Parse(input.BookingID)
	if err != nil {
		return domain.ErrInvalidInput
	}
	return u.repo.Cancel(ctx, bid, input.UserID)
}
