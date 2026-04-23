package get

import (
	"github.com/google/uuid"

	"restaurant-booking/internal/domain"
)

type Input struct {
	UserID    uuid.UUID
	BookingID string
}

type Output struct {
	Booking domain.Booking
}
