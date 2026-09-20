package create

import "restaurant-booking/catalog-service/internal/domain"

type Body struct {
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	Category    string  `json:"category"`
	IsAvailable bool    `json:"is_available"`
	Proteins    float64 `json:"proteins"`
	Fats        float64 `json:"fats"`
	Carbs       float64 `json:"carbs"`
}

type Input struct {
	RestaurantID string
	Body
}

type Output struct {
	Item domain.Dish `json:"item"`
}
