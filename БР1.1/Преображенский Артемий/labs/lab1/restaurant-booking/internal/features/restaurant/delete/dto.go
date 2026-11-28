package delete

import (
	"restaurant-booking/internal/domain"
)

type Input struct {
	ID string `json:"id"`
}

type Output struct {
	Restaurant domain.Restaurant `json:"restaurant"`
}
