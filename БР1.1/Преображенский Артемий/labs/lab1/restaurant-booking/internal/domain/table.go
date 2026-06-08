package domain

import "github.com/google/uuid"

type Table struct {
	ID           uuid.UUID `json:"id"`
	RestaurantID uuid.UUID `json:"restaurant_id"`
	Number       int       `json:"table_number"`
	Seats        int       `json:"seats_count"`
}

func (t Table) Validate() error {
	if t.RestaurantID == uuid.Nil {
		return ErrInvalidInput
	}
	if t.Number <= 0 || t.Seats <= 0 {
		return ErrInvalidInput
	}
	return nil
}
