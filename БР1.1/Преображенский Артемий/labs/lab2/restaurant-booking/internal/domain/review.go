package domain

import (
	"time"

	"github.com/google/uuid"
)

type Rating int

type Review struct {
	ID           uuid.UUID `json:"id"`
	UserID       uuid.UUID `json:"user_id"`
	RestaurantID uuid.UUID `json:"restaurant_id"`
	Text         string    `json:"text"`
	Rating       Rating    `json:"rating"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
