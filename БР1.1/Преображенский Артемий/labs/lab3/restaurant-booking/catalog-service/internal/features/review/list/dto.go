package list

import (
	"time"

	"github.com/google/uuid"
)

type Input struct {
	RestaurantID string
}

type Item struct {
	ID         uuid.UUID `json:"id"`
	Rating     int       `json:"rating"`
	Text       string    `json:"text"`
	CreatedAt  time.Time `json:"created_at"`
	AuthorName string    `json:"author_name"`
}

type Output struct {
	Items []Item
}
