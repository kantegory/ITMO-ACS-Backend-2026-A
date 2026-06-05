package create

import (
	"github.com/google/uuid"

	"restaurant-booking/internal/domain"
)

type Input struct {
	UserID       uuid.UUID `json:"user_id"`
	RestaurantID string    `json:"restaurant_id"`
	Number       int       `json:"table_number"`
	Seats        int       `json:"seats_count"`
}

type Output struct {
	Table domain.Table `json:"table"`
}
