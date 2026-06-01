package cancelbooking

import (
	"context"

	"github.com/borodin-maksim/restaurant-booking/booking-service/internal/domain"
)

type UseCase struct {
	bookingRepo bookingRepository
}

func New(bookingRepo bookingRepository) *UseCase {
	return &UseCase{bookingRepo: bookingRepo}
}

func (uc *UseCase) Cancel(ctx context.Context, bookingID, userID string) error {
	b, err := uc.bookingRepo.GetByID(ctx, bookingID)
	if err != nil {
		return err
	}

	if b.UserID != userID {
		return domain.ErrForbidden
	}

	if b.Status == domain.BookingStatusCancelled {
		return domain.ErrBookingNotCancellable
	}

	return uc.bookingRepo.UpdateStatus(ctx, bookingID, domain.BookingStatusCancelled)
}
