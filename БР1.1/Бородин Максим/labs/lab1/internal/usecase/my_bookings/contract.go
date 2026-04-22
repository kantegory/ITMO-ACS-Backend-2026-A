package mybookings

import (
	"context"

	"github.com/borodin-maksim/restaurant-booking/internal/domain"
	bookingrepo "github.com/borodin-maksim/restaurant-booking/internal/infrastructure/database/booking"
)

type bookingRepository interface {
	List(ctx context.Context, f bookingrepo.Filter) ([]*domain.Booking, int, error)
}
