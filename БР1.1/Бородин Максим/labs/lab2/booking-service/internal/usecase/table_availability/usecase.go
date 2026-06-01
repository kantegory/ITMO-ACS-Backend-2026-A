package tableavailability

import (
	"context"
	"errors"

	"github.com/borodin-maksim/restaurant-booking/booking-service/internal/domain"
	rc "github.com/borodin-maksim/restaurant-booking/booking-service/internal/infrastructure/client/restaurant"
)

type TableWithAvailability struct {
	ID           string `json:"id"`
	RestaurantID string `json:"restaurant_id"`
	TableNumber  int    `json:"table_number"`
	Capacity     int    `json:"capacity"`
	IsAvailable  bool   `json:"is_available"`
}

type Request struct {
	RestaurantID string
	Date         string
	TimeFrom     string
	TimeTo       string
	Guests       int
}

type UseCase struct {
	bookingRepo      bookingRepository
	restaurantClient restaurantClient
}

func New(bookingRepo bookingRepository, restaurantClient restaurantClient) *UseCase {
	return &UseCase{bookingRepo: bookingRepo, restaurantClient: restaurantClient}
}

func (uc *UseCase) GetAvailability(ctx context.Context, req Request) ([]*TableWithAvailability, error) {
	if req.Date == "" {
		return nil, domain.ErrInvalidRequest
	}

	tables, err := uc.restaurantClient.ListTables(ctx, req.RestaurantID)
	if err != nil {
		if errors.Is(err, rc.ErrRestaurantNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}

	tableIDs := make([]string, 0, len(tables))
	for _, t := range tables {
		tableIDs = append(tableIDs, t.ID)
	}

	bookedIDs := map[string]bool{}
	if req.TimeFrom != "" && req.TimeTo != "" {
		bookedIDs, err = uc.bookingRepo.GetBookedTableIDs(ctx, tableIDs, req.Date, req.TimeFrom, req.TimeTo)
		if err != nil {
			return nil, err
		}
	}

	var result []*TableWithAvailability
	for _, t := range tables {
		if req.Guests > 0 && t.Capacity < req.Guests {
			continue
		}
		result = append(result, &TableWithAvailability{
			ID:           t.ID,
			RestaurantID: t.RestaurantID,
			TableNumber:  t.TableNumber,
			Capacity:     t.Capacity,
			IsAvailable:  !bookedIDs[t.ID],
		})
	}
	return result, nil
}
