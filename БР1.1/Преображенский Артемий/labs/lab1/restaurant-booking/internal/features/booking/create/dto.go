package create

import (
	"github.com/google/uuid"

	"restaurant-booking/internal/domain"
)

type Input struct {
	UserID       uuid.UUID
	RestaurantID uuid.UUID `json:"restaurant_id"`
	TableID      uuid.UUID `json:"table_id"`
	BookingDate  string    `json:"booking_date"`
	StartTime    string    `json:"start_time"`
	EndTime      string    `json:"end_time"`
	GuestsCount  int       `json:"guests_count"`
}

type Output struct {
	Booking domain.Booking
}
