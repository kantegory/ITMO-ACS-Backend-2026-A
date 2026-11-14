package delete

import "github.com/google/uuid"

type Input struct {
	UserID       uuid.UUID
	RestaurantID string
	ReviewID     string
}
