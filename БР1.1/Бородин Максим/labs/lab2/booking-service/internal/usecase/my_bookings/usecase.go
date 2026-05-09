package mybookings

import (
	"context"

	"github.com/borodin-maksim/restaurant-booking/booking-service/internal/domain"
	bookingrepo "github.com/borodin-maksim/restaurant-booking/booking-service/internal/infrastructure/database/booking"
)

type Request struct {
	UserID string
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

func (uc *UseCase) MyBookings(ctx context.Context, req Request) (*Response, error) {
	items, total, err := uc.bookingRepo.List(ctx, bookingrepo.Filter{
		UserID: req.UserID,
		Limit:  req.Limit,
		Offset: req.Offset,
	})
	if err != nil {
		return nil, err
	}
	return &Response{Items: items, Total: total}, nil
}
