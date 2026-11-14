package list

import "restaurant-booking/catalog-service/internal/domain"

type Input struct {
	RestaurantID string
}

type Output struct {
	Items []domain.Table
}
