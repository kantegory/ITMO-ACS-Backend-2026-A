package create

import (
	"github.com/google/uuid"

	"restaurant-booking/internal/domain"
)

type Input struct {
	UserID       uuid.UUID `json:"user_id"`
	RestaurantID string    `json:"restaurant_id"`
	Name         string    `json:"name"`
	Description  string    `json:"description"`
	Price        float64   `json:"price"`
	Category     string    `json:"category"`
	IsAvailable  bool      `json:"is_available"`
	Proteins     float64   `json:"proteins"`
	Fats         float64   `json:"fats"`
	Carbs        float64   `json:"carbs"`
}

type Output struct {
	Item domain.Dish `json:"item"`
}
