package create

import (
	"github.com/google/uuid"

	"restaurant-booking/internal/domain"
)

type Input struct {
	UserID       uuid.UUID `json:"user_id"`
	RestaurantID string    `json:"restaurant_id"`
	Rating       int       `json:"rating"`
	Text         string    `json:"text"`
}

type Output struct {
	Review domain.Review `json:"review"`
}
