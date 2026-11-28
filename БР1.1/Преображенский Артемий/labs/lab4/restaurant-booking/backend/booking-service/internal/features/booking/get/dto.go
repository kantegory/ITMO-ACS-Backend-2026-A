package get

import (
	"github.com/google/uuid"

	"restaurant-booking/booking-service/internal/domain"
)

type Input struct {
	UserID    uuid.UUID
	BookingID string
}

type Output struct {
	Booking domain.Booking
}
