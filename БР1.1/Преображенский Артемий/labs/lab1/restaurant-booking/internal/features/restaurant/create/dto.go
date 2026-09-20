package create

import (
	"github.com/google/uuid"

	"restaurant-booking/internal/domain"
)

type Input struct {
	UserID        uuid.UUID            `json:"user_id"`
	Name          string               `json:"name"`
	Description   string               `json:"description"`
	City          domain.City          `json:"city"`
	Address       domain.Address       `json:"address"`
	CuisineType   domain.CuisineType   `json:"cuisine_type"`
	PriceCategory domain.PriceCategory `json:"price_category"`
	Photos        []domain.URL         `json:"photos"`
}

type Output struct {
	Restaurant domain.Restaurant `json:"restaurant"`
}
