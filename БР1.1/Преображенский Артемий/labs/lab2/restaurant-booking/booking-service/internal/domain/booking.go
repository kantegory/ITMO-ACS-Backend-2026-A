package domain

import (
	"time"

	"github.com/google/uuid"
)

func JoinBookingDateTimes(bookingDate, startClock, endClock time.Time) (time.Time, time.Time) {
	d := bookingDate.UTC()
	s := startClock.UTC()
	e := endClock.UTC()
	start := time.Date(d.Year(), d.Month(), d.Day(), s.Hour(), s.Minute(), s.Second(), s.Nanosecond(), time.UTC)
	end := time.Date(d.Year(), d.Month(), d.Day(), e.Hour(), e.Minute(), e.Second(), e.Nanosecond(), time.UTC)
	return start, end
}

func ValidateBookingSchedule(startTime, endTime time.Time) error {
	if startTime.IsZero() || endTime.IsZero() {
		return ErrInvalidInput
	}
	if !endTime.After(startTime) {
		return ErrInvalidInput
	}
	st := startTime.UTC()
	et := endTime.UTC()
	if st.Year() != et.Year() || st.Month() != et.Month() || st.Day() != et.Day() {
		return ErrInvalidInput
	}
	return nil
}

type BookingStatus string

type Booking struct {
	ID           uuid.UUID     `json:"id"`
	UserID       uuid.UUID     `json:"user_id"`
	RestaurantID uuid.UUID     `json:"restaurant_id"`
	TableID      uuid.UUID     `json:"table_id"`
	GuestsCount  int           `json:"guests_count"`
	StartTime    time.Time     `json:"start_time"`
	EndTime      time.Time     `json:"end_time"`
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
	return ValidateBookingSchedule(b.StartTime, b.EndTime)
}
