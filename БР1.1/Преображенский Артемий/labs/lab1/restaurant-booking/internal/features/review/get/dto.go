package get

import (
	"restaurant-booking/internal/domain"
)

type Input struct {
	RestaurantID string `json:"restaurant_id"`
	ReviewID     string `json:"review_id"`
}

type Output struct {
	Review domain.Review `json:"review"`
}
