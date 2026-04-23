package list

import "restaurant-booking/internal/domain"

type Input struct {
	RestaurantID string
}

type Output struct {
	Items []domain.Dish
}
