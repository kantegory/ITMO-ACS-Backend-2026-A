package domain

import "time"

const (
	BookingStatusPending   = "pending"
	BookingStatusConfirmed = "confirmed"
	BookingStatusCancelled = "cancelled"
)

type Booking struct {
	ID          string
	UserID      string
	TableID     string
	BookedDate  string
	TimeFrom    string
	TimeTo      string
	GuestsCount int
	Status      string
	CreatedAt   time.Time
}
