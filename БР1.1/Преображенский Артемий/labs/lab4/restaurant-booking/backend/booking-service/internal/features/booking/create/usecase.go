package create

import (
	"context"
	"time"

	"github.com/google/uuid"

	"restaurant-booking/booking-service/internal/domain"
)

type Repository interface {
	HasOverlap(ctx context.Context, tableID uuid.UUID, startTime time.Time, endTime time.Time) (bool, error)
	Create(ctx context.Context, b domain.Booking) (domain.Booking, error)
}

type CatalogClient interface {
	GetTable(ctx context.Context, restaurantID uuid.UUID, tableID uuid.UUID) (domain.Table, error)
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
	b := domain.Booking{
		UserID:       input.UserID,
		RestaurantID: input.RestaurantID,
		TableID:      input.TableID,
		GuestsCount:  input.GuestsCount,
		StartTime:    input.StartTime,
		EndTime:      input.EndTime,
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
	overlap, err := u.repo.HasOverlap(ctx, input.TableID, input.StartTime, input.EndTime)
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
