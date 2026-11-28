package delete

import "github.com/google/uuid"

type Input struct {
	UserID       uuid.UUID `json:"user_id"`
	RestaurantID string    `json:"restaurant_id"`
	TableID      string    `json:"table_id"`
}
