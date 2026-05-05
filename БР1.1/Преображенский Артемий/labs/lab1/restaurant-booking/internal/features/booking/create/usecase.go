package create

import (
	"context"
	"strings"

	"github.com/google/uuid"

	"restaurant-booking/internal/domain"
)

type Repository interface {
	TableForRestaurant(ctx context.Context, tableID, restaurantID uuid.UUID) (domain.Table, error)
	HasOverlap(ctx context.Context, tableID uuid.UUID, bookingDate string, startTime string, endTime string) (bool, error)
	Create(ctx context.Context, b domain.Booking) (domain.Booking, error)
}

type Usecase struct {
	repo Repository
}

func NewUsecase(repo Repository) *Usecase {
	return &Usecase{repo: repo}
}

func (u *Usecase) Create(ctx context.Context, input Input) (Output, error) {
	restaurantID, err := uuid.Parse(input.RestaurantID)
	if err != nil {
		return Output{}, domain.ErrInvalidInput
	}
	tableID, err := uuid.Parse(input.TableID)
	if err != nil {
		return Output{}, domain.ErrInvalidInput
	}
	bookingDate := strings.TrimSpace(input.BookingDate)
	startTime := strings.TrimSpace(input.StartTime)
	endTime := strings.TrimSpace(input.EndTime)

	b := domain.Booking{
		UserID:       input.UserID,
		RestaurantID: restaurantID,
		TableID:      tableID,
		GuestsCount:  input.GuestsCount,
		BookingDate:  bookingDate,
		StartTime:    startTime,
		EndTime:      endTime,
	}
	t, err := u.repo.TableForRestaurant(ctx, b.TableID, b.RestaurantID)
	if err != nil {
		return Output{}, err
	}
	if t.Seats < b.GuestsCount {
		return Output{}, domain.ErrUnavailable
	}
	overlap, err := u.repo.HasOverlap(ctx, b.TableID, b.BookingDate, b.StartTime, b.EndTime)
	if err != nil {
		return Output{}, err
	}
	if overlap {
		return Output{}, domain.ErrUnavailable
	}
	if err := b.Validate(); err != nil {
		return Output{}, err
	}
	created, err := u.repo.Create(ctx, b)
	if err != nil {
		return Output{}, err
	}
	return Output{Booking: created}, nil
}
