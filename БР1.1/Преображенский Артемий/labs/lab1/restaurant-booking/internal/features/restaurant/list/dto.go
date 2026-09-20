package list

import "restaurant-booking/internal/domain"

type Input struct {
	City          domain.City          `json:"city"`
	CuisineType   domain.CuisineType   `json:"cuisine_type"`
	PriceCategory domain.PriceCategory `json:"price_category"`
}

type Output struct {
	Restaurants []domain.Restaurant `json:"restaurants"`
}
