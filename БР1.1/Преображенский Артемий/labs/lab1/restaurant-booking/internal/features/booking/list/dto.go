package list

import (
	"github.com/google/uuid"

	"restaurant-booking/internal/domain"
)

type Input struct {
	UserID uuid.UUID
}

type Output struct {
	Bookings []domain.Booking
}
