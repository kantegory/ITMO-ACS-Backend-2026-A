package domain

import "github.com/google/uuid"

type Table struct {
	ID           uuid.UUID `json:"id"`
	RestaurantID uuid.UUID `json:"restaurant_id"`
	Number       int       `json:"table_number"`
	Seats        int       `json:"seats_count"`
}
