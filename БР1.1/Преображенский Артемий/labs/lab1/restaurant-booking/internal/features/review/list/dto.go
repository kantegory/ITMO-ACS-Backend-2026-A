package list

import (
	"restaurant-booking/internal/domain"
)

type Input struct {
	RestaurantID string `json:"restaurant_id"`
}

type Output struct {
	Reviews []domain.Review `json:"reviews"`
}
