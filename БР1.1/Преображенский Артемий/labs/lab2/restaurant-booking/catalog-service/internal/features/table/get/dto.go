package get

import "restaurant-booking/catalog-service/internal/domain"

type Input struct {
	RestaurantID string
	TableID      string
}

type Output struct {
	Table domain.Table `json:"table"`
}
