package create

import (
	"time"

	"github.com/google/uuid"

	"restaurant-booking/booking-service/internal/domain"
)

type Input struct {
	UserID       uuid.UUID
	RestaurantID uuid.UUID `json:"restaurant_id"`
	TableID      uuid.UUID `json:"table_id"`
	StartTime    time.Time `json:"start_time"`
	EndTime      time.Time `json:"end_time"`
	GuestsCount  int       `json:"guests_count"`
}

type Output struct {
	Booking domain.Booking
}
