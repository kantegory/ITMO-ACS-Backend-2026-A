package domain

import (
	"strings"
	"time"

	"github.com/google/uuid"
)

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
	if strings.TrimSpace(b.BookingDate) == "" || strings.TrimSpace(b.StartTime) == "" || strings.TrimSpace(b.EndTime) == "" {
		return ErrInvalidInput
	}
	return nil
}
