package get

import (
	"time"

	"github.com/google/uuid"
)

type Input struct {
	RestaurantID string
	ReviewID     string
}

type Item struct {
	ID         uuid.UUID `json:"id"`
	Rating     int       `json:"rating"`
	Text       string    `json:"text"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
	AuthorName string    `json:"author_name"`
}

type Output struct {
	Item Item
}
