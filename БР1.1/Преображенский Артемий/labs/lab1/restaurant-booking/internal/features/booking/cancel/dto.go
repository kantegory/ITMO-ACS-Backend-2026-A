package cancel

import "github.com/google/uuid"

type Input struct {
	UserID    uuid.UUID `json:"user_id"`
	BookingID string    `json:"booking_id"`
}

type Output struct {
	Success bool `json:"success"`
}
