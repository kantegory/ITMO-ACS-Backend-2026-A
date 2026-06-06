package model

import "time"

type Property struct {
	ID            string    `json:"id"`
	OwnerID       string    `json:"owner_id"`
	Title         string    `json:"title"`
	Description   string    `json:"description"`
	PropertyType  string    `json:"property_type"`
	PricePerNight float64   `json:"price_per_night"`
	Currency      string    `json:"currency"`
	City          string    `json:"city"`
	Address       *string   `json:"address,omitempty"`
	Lat           *float64  `json:"lat,omitempty"`
	Lon           *float64  `json:"lon,omitempty"`
	Rooms         *int      `json:"rooms,omitempty"`
	Beds          *int      `json:"beds,omitempty"`
	MaxGuests     int       `json:"max_guests"`
	AreaM2        *float64  `json:"area_m2,omitempty"`
	CheckInTime   *string   `json:"check_in_time,omitempty"`
	CheckOutTime  *string   `json:"check_out_time,omitempty"`
	Rules         *string   `json:"rules,omitempty"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type Favorite struct {
	UserID     string    `json:"user_id"`
	PropertyID string    `json:"property_id"`
	CreatedAt  time.Time `json:"created_at"`
}
