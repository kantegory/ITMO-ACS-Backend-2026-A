package create

import (
	"context"
	"strings"

	"github.com/google/uuid"

	"restaurant-booking/booking-service/internal/adapter/catalogclient"
	"restaurant-booking/booking-service/internal/domain"
)

type Repository interface {
	HasOverlap(ctx context.Context, tableID uuid.UUID, bookingDate string, startTime string, endTime string) (bool, error)
	Create(ctx context.Context, b domain.Booking) (domain.Booking, error)
}

type CatalogClient interface {
	GetTable(ctx context.Context, restaurantID uuid.UUID, tableID uuid.UUID) (catalogclient.Table, error)
}

type Usecase struct {
	repo    Repository
	catalog CatalogClient
}

func NewUsecase(repo Repository, catalog CatalogClient) *Usecase {
	return &Usecase{repo: repo, catalog: catalog}
}

func (u *Usecase) Create(ctx context.Context, input Input) (Output, error) {
	if input.RestaurantID == uuid.Nil || input.TableID == uuid.Nil {
		return Output{}, domain.ErrInvalidInput
	}
	d := strings.TrimSpace(input.BookingDate)
	st := strings.TrimSpace(input.StartTime)
	et := strings.TrimSpace(input.EndTime)
	b := domain.Booking{
		UserID:       input.UserID,
		RestaurantID: input.RestaurantID,
		TableID:      input.TableID,
		GuestsCount:  input.GuestsCount,
		BookingDate:  d,
		StartTime:    st,
		EndTime:      et,
	}
	if err := b.Validate(); err != nil {
		return Output{}, err
	}
	table, err := u.catalog.GetTable(ctx, input.RestaurantID, input.TableID)
	if err != nil {
		return Output{}, err
	}
	if table.SeatsCount < input.GuestsCount {
		return Output{}, domain.ErrUnavailable
	}
	overlap, err := u.repo.HasOverlap(ctx, input.TableID, d, st, et)
	if err != nil {
		return Output{}, err
	}
	if overlap {
		return Output{}, domain.ErrUnavailable
	}
	created, err := u.repo.Create(ctx, b)
	if err != nil {
		return Output{}, err
	}
	return Output{Booking: created}, nil
}
