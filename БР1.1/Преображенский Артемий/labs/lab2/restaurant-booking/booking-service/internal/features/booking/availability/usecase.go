package availability

import (
	"context"
	"time"

	"github.com/google/uuid"

	"restaurant-booking/booking-service/internal/adapter/catalogclient"
	"restaurant-booking/booking-service/internal/domain"
)

type Repository interface {
	HasOverlap(ctx context.Context, tableID uuid.UUID, startTime time.Time, endTime time.Time) (bool, error)
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

func (u *Usecase) Check(ctx context.Context, input Input) (Output, error) {
	rid, err := uuid.Parse(input.RestaurantID)
	if err != nil {
		return Output{}, domain.ErrInvalidInput
	}
	tid, err := uuid.Parse(input.TableID)
	if err != nil {
		return Output{}, domain.ErrInvalidInput
	}
	if err := domain.ValidateBookingSchedule(input.StartTime, input.EndTime); err != nil {
		return Output{}, err
	}
	if _, err := u.catalog.GetTable(ctx, rid, tid); err != nil {
		return Output{}, err
	}
	overlap, err := u.repo.HasOverlap(ctx, tid, input.StartTime, input.EndTime)
	if err != nil {
		return Output{}, err
	}
	return Output{Available: !overlap}, nil
}
