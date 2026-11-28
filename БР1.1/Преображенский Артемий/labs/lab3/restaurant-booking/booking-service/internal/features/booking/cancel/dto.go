package cancel

import "github.com/google/uuid"

type Input struct {
	UserID    uuid.UUID
	BookingID string
}
