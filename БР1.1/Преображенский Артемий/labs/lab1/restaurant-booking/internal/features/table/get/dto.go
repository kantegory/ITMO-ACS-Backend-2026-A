package get

import "restaurant-booking/internal/domain"

type Input struct {
	RestaurantID string `json:"restaurant_id"`
	TableID      string `json:"table_id"`
}

type Output struct {
	Table domain.Table `json:"table"`
}
