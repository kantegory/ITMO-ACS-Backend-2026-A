package list

import "restaurant-booking/catalog-service/internal/domain"

type Input struct {
	RestaurantID string
	ProteinsMin  *float64
	ProteinsMax  *float64
	FatsMin      *float64
	FatsMax      *float64
	CarbsMin     *float64
	CarbsMax     *float64
}

type Output struct {
	Items []domain.Dish
}
