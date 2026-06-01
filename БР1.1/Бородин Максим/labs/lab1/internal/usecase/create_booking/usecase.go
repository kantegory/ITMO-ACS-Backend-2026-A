package createbooking

import (
	"context"
	"time"

	"github.com/borodin-maksim/restaurant-booking/internal/domain"
	"github.com/google/uuid"
)

type Request struct {
	UserID      string
	TableID     string
	BookedDate  string
	TimeFrom    string
	TimeTo      string
	GuestsCount int
}

type UseCase struct {
	bookingRepo bookingRepository
	tableRepo   tableRepository
}

func New(bookingRepo bookingRepository, tableRepo tableRepository) *UseCase {
	return &UseCase{bookingRepo: bookingRepo, tableRepo: tableRepo}
}

func (uc *UseCase) Create(ctx context.Context, req Request) (*domain.Booking, error) {
	if req.BookedDate == "" || req.TimeFrom == "" || req.TimeTo == "" || req.GuestsCount <= 0 {
		return nil, domain.ErrInvalidRequest
	}

	table, err := uc.tableRepo.GetByID(ctx, req.TableID)
	if err != nil {
		return nil, err
	}

	if req.GuestsCount > table.Capacity {
		return nil, domain.ErrInvalidRequest
	}

	booked, err := uc.bookingRepo.IsTableBooked(ctx, req.TableID, req.BookedDate, req.TimeFrom, req.TimeTo)
	if err != nil {
		return nil, err
	}
	if booked {
		return nil, domain.ErrTableAlreadyBooked
	}

	b := &domain.Booking{
		ID:          uuid.New().String(),
		UserID:      req.UserID,
		TableID:     req.TableID,
		BookedDate:  req.BookedDate,
		TimeFrom:    req.TimeFrom,
		TimeTo:      req.TimeTo,
		GuestsCount: req.GuestsCount,
		Status:      domain.BookingStatusPending,
		CreatedAt:   time.Now().UTC(),
	}

	if err := uc.bookingRepo.Create(ctx, b); err != nil {
		return nil, err
	}
	return b, nil
}
