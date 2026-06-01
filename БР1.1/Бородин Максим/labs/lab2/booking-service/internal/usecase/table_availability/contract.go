package tableavailability

import (
	"context"

	rc "github.com/borodin-maksim/restaurant-booking/booking-service/internal/infrastructure/client/restaurant"
)

type bookingRepository interface {
	GetBookedTableIDs(ctx context.Context, tableIDs []string, date, timeFrom, timeTo string) (map[string]bool, error)
}

type restaurantClient interface {
	ListTables(ctx context.Context, restaurantID string) ([]*rc.TableInfo, error)
}
