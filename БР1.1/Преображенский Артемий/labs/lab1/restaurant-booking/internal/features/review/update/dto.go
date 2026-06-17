package update

import (
	"github.com/google/uuid"

	"restaurant-booking/internal/domain"
)

type Body struct {
	Rating int
	Text   string
}

type Input struct {
	UserID       uuid.UUID
	RestaurantID string
	ReviewID     string
	Rating       int
	Text         string
}

type Output struct {
	Review domain.Review
}
