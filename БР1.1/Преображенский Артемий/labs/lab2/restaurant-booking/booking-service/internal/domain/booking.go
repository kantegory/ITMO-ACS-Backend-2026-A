package domain

import (
	"strings"
	"time"

	"github.com/google/uuid"
)

func ValidateBookingSchedule(bookingDate, startTime, endTime string) error {
	d := strings.TrimSpace(bookingDate)
	st := strings.TrimSpace(startTime)
	et := strings.TrimSpace(endTime)
	if d == "" || st == "" || et == "" {
		return ErrInvalidInput
	}
	if _, err := time.Parse(time.DateOnly, d); err != nil {
		return ErrInvalidInput
	}
	startClock, err := parseClock(st)
	if err != nil {
		return ErrInvalidInput
	}
	endClock, err := parseClock(et)
	if err != nil {
		return ErrInvalidInput
	}
	if !endClock.After(startClock) {
		return ErrInvalidInput
	}
	return nil
}

func parseClock(s string) (time.Time, error) {
	s = strings.TrimSpace(s)
	if s == "" {
		return time.Time{}, ErrInvalidInput
	}
	for _, layout := range []string{"15:04:05", "15:04"} {
		if t, err := time.Parse(layout, s); err == nil {
			return t, nil
		}
	}
	return time.Time{}, ErrInvalidInput
}

type BookingStatus string

type Booking struct {
	ID           uuid.UUID     `json:"id"`
	UserID       uuid.UUID     `json:"user_id"`
	RestaurantID uuid.UUID     `json:"restaurant_id"`
	TableID      uuid.UUID     `json:"table_id"`
	GuestsCount  int           `json:"guests_count"`
	BookingDate  string        `json:"booking_date"`
	StartTime    string        `json:"start_time"`
	EndTime      string        `json:"end_time"`
	Status       BookingStatus `json:"status"`
	CreatedAt    time.Time     `json:"created_at"`
	UpdatedAt    time.Time     `json:"updated_at"`
}

func (b Booking) Validate() error {
	if b.UserID == uuid.Nil || b.RestaurantID == uuid.Nil || b.TableID == uuid.Nil {
		return ErrInvalidInput
	}
	if b.GuestsCount <= 0 {
		return ErrInvalidInput
	}
	return ValidateBookingSchedule(b.BookingDate, b.StartTime, b.EndTime)
}
