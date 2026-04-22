package createbooking

import (
	"context"

	"github.com/borodin-maksim/restaurant-booking/internal/domain"
)

type bookingRepository interface {
	Create(ctx context.Context, b *domain.Booking) error
	IsTableBooked(ctx context.Context, tableID, date, timeFrom, timeTo string) (bool, error)
}

type tableRepository interface {
	GetByID(ctx context.Context, id string) (*domain.Table, error)
}
