package model

import "time"

type Booking struct {
	ID          string    `json:"id"`
	PropertyID  string    `json:"property_id"`
	TenantID    string    `json:"tenant_id"`
	StartDate   string    `json:"start_date"`
	EndDate     string    `json:"end_date"`
	GuestsCount int       `json:"guests_count"`
	PriceTotal  float64   `json:"price_total"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Review struct {
	ID         string    `json:"id"`
	BookingID  string    `json:"booking_id"`
	PropertyID string    `json:"property_id"`
	AuthorID   string    `json:"author_id"`
	Rating     int       `json:"rating"`
	Text       *string   `json:"text,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
}

type Payment struct {
	ID        string    `json:"id"`
	BookingID string    `json:"booking_id"`
	Amount    float64   `json:"amount"`
	Currency  string    `json:"currency"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

type Property struct {
	ID            string  `json:"id"`
	OwnerID       string  `json:"owner_id"`
	PricePerNight float64 `json:"price_per_night"`
}
