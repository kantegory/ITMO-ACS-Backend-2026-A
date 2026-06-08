package domain

import "github.com/google/uuid"

type Table struct {
	ID           uuid.UUID `json:"id"`
	RestaurantID uuid.UUID `json:"restaurant_id"`
	TableNumber  int       `json:"table_number"`
	SeatsCount   int       `json:"seats_count"`
}
