package get

import "restaurant-booking/catalog-service/internal/domain"

type Input struct {
	RestaurantID string
	ItemID       string
}

type Output struct {
	Item domain.Dish `json:"item"`
}
