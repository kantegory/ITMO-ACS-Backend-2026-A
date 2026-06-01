package tableavailability

import (
	"context"

	"github.com/borodin-maksim/restaurant-booking/internal/domain"
)

type TableWithAvailability struct {
	domain.Table
	IsAvailable bool
}

type Request struct {
	RestaurantID string
	Date         string
	TimeFrom     string
	TimeTo       string
	Guests       int
}

type UseCase struct {
	tableRepo      tableRepository
	restaurantRepo restaurantRepository
}

func New(tableRepo tableRepository, restaurantRepo restaurantRepository) *UseCase {
	return &UseCase{tableRepo: tableRepo, restaurantRepo: restaurantRepo}
}

func (uc *UseCase) GetAvailability(ctx context.Context, req Request) ([]*TableWithAvailability, error) {
	if req.Date == "" {
		return nil, domain.ErrInvalidRequest
	}

	exists, err := uc.restaurantRepo.ExistsByID(ctx, req.RestaurantID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, domain.ErrNotFound
	}

	tables, err := uc.tableRepo.ListByRestaurant(ctx, req.RestaurantID)
	if err != nil {
		return nil, err
	}

	bookedIDs := map[string]bool{}
	if req.TimeFrom != "" && req.TimeTo != "" {
		bookedIDs, err = uc.tableRepo.GetBookedTableIDs(ctx, req.RestaurantID, req.Date, req.TimeFrom, req.TimeTo)
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
			Table:       *t,
			IsAvailable: !bookedIDs[t.ID],
		})
	}
	return result, nil
}
