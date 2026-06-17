package cancel

import (
	"context"

	"github.com/google/uuid"

	"restaurant-booking/internal/domain"
)

type Repository interface {
	Cancel(ctx context.Context, userID uuid.UUID, bookingID uuid.UUID) error
}

type Usecase struct {
	repo Repository
}

func NewUsecase(repo Repository) *Usecase {
	return &Usecase{repo: repo}
}

func (u *Usecase) Cancel(ctx context.Context, input Input) (Output, error) {
	bid, err := uuid.Parse(input.BookingID)
	if err != nil {
		return Output{}, domain.ErrInvalidInput
	}
	if err := u.repo.Cancel(ctx, input.UserID, bid); err != nil {
		return Output{}, err
	}
	return Output{OK: true}, nil
}
