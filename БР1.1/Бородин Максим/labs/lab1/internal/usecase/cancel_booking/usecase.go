package cancelbooking

import (
	"context"

	"github.com/borodin-maksim/restaurant-booking/internal/domain"
)

type UseCase struct {
	bookingRepo bookingRepository
}

func New(bookingRepo bookingRepository) *UseCase {
	return &UseCase{bookingRepo: bookingRepo}
}

func (uc *UseCase) Cancel(ctx context.Context, bookingID, userID string) (*domain.Booking, error) {
	b, err := uc.bookingRepo.GetByID(ctx, bookingID)
	if err != nil {
		return nil, err
	}

	if b.UserID != userID {
		return nil, domain.ErrForbidden
	}

	if b.Status == domain.BookingStatusCancelled {
		return nil, domain.ErrBookingNotCancellable
	}

	if err := uc.bookingRepo.UpdateStatus(ctx, bookingID, domain.BookingStatusCancelled); err != nil {
		return nil, err
	}

	b.Status = domain.BookingStatusCancelled
	return b, nil
}
