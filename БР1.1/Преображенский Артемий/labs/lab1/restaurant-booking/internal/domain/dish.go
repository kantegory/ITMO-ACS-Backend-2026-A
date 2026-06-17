package domain

import "github.com/google/uuid"

type Price float64

type Category string

type Dish struct {
	ID           uuid.UUID `json:"id"`
	RestaurantID uuid.UUID `json:"restaurant_id"`
	Name         string    `json:"name"`
	Description  string    `json:"description"`
	IsAvailable  bool      `json:"is_available"`
	Proteins     float64   `json:"proteins"`
	Fats         float64   `json:"fats"`
	Carbs        float64   `json:"carbs"`
	Price        Price     `json:"price"`
	Category     Category  `json:"category"`
}
