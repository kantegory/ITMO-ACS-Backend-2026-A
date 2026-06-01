package cancelbooking

import (
	"context"

	"github.com/borodin-maksim/restaurant-booking/booking-service/internal/domain"
)

type bookingRepository interface {
	GetByID(ctx context.Context, id string) (*domain.Booking, error)
	UpdateStatus(ctx context.Context, id, status string) error
}
