package get

import "restaurant-booking/catalog-service/internal/domain"

type Input struct {
	ID string `json:"id"`
}

type Output struct {
	domain.Restaurant `json:"restaurant"`
}
