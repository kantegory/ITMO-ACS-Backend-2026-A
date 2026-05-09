package createbooking

import (
	"context"

	"github.com/borodin-maksim/restaurant-booking/booking-service/internal/domain"
	rc "github.com/borodin-maksim/restaurant-booking/booking-service/internal/infrastructure/client/restaurant"
)

type bookingRepository interface {
	Create(ctx context.Context, b *domain.Booking) error
	IsTableBooked(ctx context.Context, tableID, date, timeFrom, timeTo string) (bool, error)
}

type restaurantClient interface {
	GetTable(ctx context.Context, id string) (*rc.TableInfo, error)
}
