package create

import (
	"context"
	"log"
	"time"

	"github.com/google/uuid"

	"restaurant-booking/booking-service/internal/adapter/catalogclient"
	"restaurant-booking/booking-service/internal/domain"
)

type Repository interface {
	HasOverlap(ctx context.Context, tableID uuid.UUID, startTime time.Time, endTime time.Time) (bool, error)
	Create(ctx context.Context, b domain.Booking) (domain.Booking, error)
}

type CatalogClient interface {
	GetTable(ctx context.Context, restaurantID uuid.UUID, tableID uuid.UUID) (catalogclient.Table, error)
}

type BookingEventPublisher interface {
	PublishBookingCreated(ctx context.Context, b domain.Booking) error
}

type Usecase struct {
	repo      Repository
	catalog   CatalogClient
	publisher BookingEventPublisher
}

func NewUsecase(repo Repository, catalog CatalogClient, publisher BookingEventPublisher) *Usecase {
	return &Usecase{repo: repo, catalog: catalog, publisher: publisher}
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
	if u.publisher != nil {
		if err := u.publisher.PublishBookingCreated(ctx, created); err != nil {
			log.Printf("rabbitmq: %v", err)
		}
	}
	return Output{Booking: created}, nil
}
