package listbookings

import (
	"context"

	"github.com/borodin-maksim/restaurant-booking/internal/domain"
	bookingrepo "github.com/borodin-maksim/restaurant-booking/internal/infrastructure/database/booking"
)

type Request struct {
	Status string
	Limit  int
	Offset int
}

type Response struct {
	Items []*domain.Booking
	Total int
}

type UseCase struct {
	bookingRepo bookingRepository
}

func New(bookingRepo bookingRepository) *UseCase {
	return &UseCase{bookingRepo: bookingRepo}
}

func (uc *UseCase) List(ctx context.Context, req Request) (*Response, error) {
	items, total, err := uc.bookingRepo.List(ctx, bookingrepo.Filter{
		Status: req.Status,
		Limit:  req.Limit,
		Offset: req.Offset,
	})
	if err != nil {
		return nil, err
	}
	return &Response{Items: items, Total: total}, nil
}
