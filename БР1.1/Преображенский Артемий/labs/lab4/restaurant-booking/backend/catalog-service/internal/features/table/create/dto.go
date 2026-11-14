package create

import "restaurant-booking/catalog-service/internal/domain"

type Body struct {
	Number int `json:"table_number"`
	Seats  int `json:"seats_count"`
}

type Input struct {
	RestaurantID string
	Body
}

type Output struct {
	Table domain.Table `json:"table"`
}
