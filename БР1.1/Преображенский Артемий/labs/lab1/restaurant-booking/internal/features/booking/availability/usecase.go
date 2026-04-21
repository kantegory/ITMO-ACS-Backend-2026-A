package availability

import (
	"context"
	"strings"

	"github.com/google/uuid"

	"restaurant-booking/internal/domain"
)

type Repository interface {
	TableForRestaurant(ctx context.Context, tableID, restaurantID uuid.UUID) (domain.Table, error)
	HasOverlap(ctx context.Context, tableID uuid.UUID, bookingDate string, startTime string, endTime string) (bool, error)
}

type Usecase struct {
	repo Repository
}

func NewUsecase(repo Repository) *Usecase {
	return &Usecase{repo: repo}
}

func (u *Usecase) Check(ctx context.Context, input Input) (Output, error) {
	rid, err := uuid.Parse(input.RestaurantID)
	if err != nil {
		return Output{}, domain.ErrInvalidInput
	}
	tid, err := uuid.Parse(input.TableID)
	if err != nil {
		return Output{}, domain.ErrInvalidInput
	}
	d := strings.TrimSpace(input.BookingDate)
	st := strings.TrimSpace(input.StartTime)
	et := strings.TrimSpace(input.EndTime)
	if d == "" || st == "" || et == "" {
		return Output{}, domain.ErrInvalidInput
	}
	_, err = u.repo.TableForRestaurant(ctx, tid, rid)
	if err != nil {
		return Output{}, err
	}
	overlap, err := u.repo.HasOverlap(ctx, tid, d, st, et)
	if err != nil {
		return Output{}, err
	}
	return Output{Available: !overlap}, nil
}
