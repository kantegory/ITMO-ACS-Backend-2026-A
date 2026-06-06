package model

import "time"

type User struct {
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	Phone        *string   `json:"phone,omitempty"`
	PasswordHash string    `json:"-"`
	FullName     string    `json:"full_name"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

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

type PropertyPhoto struct {
	ID         string    `json:"id"`
	PropertyID string    `json:"property_id"`
	URL        string    `json:"url"`
	Position   int       `json:"position"`
	CreatedAt  time.Time `json:"created_at"`
}

type Amenity struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

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

type Chat struct {
	ID         string    `json:"id"`
	PropertyID *string   `json:"property_id,omitempty"`
	BookingID  *string   `json:"booking_id,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
}

type Message struct {
	ID        string    `json:"id"`
	ChatID    string    `json:"chat_id"`
	SenderID  string    `json:"sender_id"`
	Text      string    `json:"text"`
	CreatedAt time.Time `json:"created_at"`
	IsRead    bool      `json:"is_read"`
}

type Favorite struct {
	UserID     string    `json:"user_id"`
	PropertyID string    `json:"property_id"`
	CreatedAt  time.Time `json:"created_at"`
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
