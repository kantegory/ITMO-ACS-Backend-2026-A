package domain

import (
	"strings"

	"github.com/google/uuid"
)

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

func (d Dish) Validate() error {
	if d.RestaurantID == uuid.Nil {
		return ErrInvalidInput
	}
	if strings.TrimSpace(d.Name) == "" || strings.TrimSpace(d.Description) == "" || strings.TrimSpace(string(d.Category)) == "" {
		return ErrInvalidInput
	}
	if d.Price <= 0 {
		return ErrInvalidInput
	}
	if d.Proteins < 0 || d.Fats < 0 || d.Carbs < 0 {
		return ErrInvalidInput
	}
	return nil
}
