package models

import "time"

type Property struct {
	ID      uint `gorm:"primaryKey" json:"id"`
	OwnerID uint `gorm:"not null" json:"owner_id"`

	Title   string       `gorm:"not null" json:"title"`
	Type    PropertyType `gorm:"type:varchar(20);not null" json:"type"`
	City    string       `json:"city"`
	Address string       `json:"address"`

	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`

	Description     string `json:"description"`
	PricePerMonth   int    `gorm:"not null" json:"price_per_month"`
	Deposit         int    `json:"deposit"`
	Commission      int    `json:"commission"`
	Area            int    `json:"area"`
	Prepayment      string `json:"prepayment"`
	MinRentalPeriod string `json:"min_rental_period"`

	IsVerified bool `gorm:"not null" json:"is_verified"`
	IsVacant   bool `json:"is_vacant"`

	Amenities []Amenity       `gorm:"many2many:property_amenities;" json:"amenities,omitempty"`
	Images    []PropertyImage `json:"images,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type PropertyType string

const (
	Apartment PropertyType = "APARTMENT"
	House     PropertyType = "HOUSE"
	Room      PropertyType = "ROOM"
	Studio    PropertyType = "STUDIO"
)

func (p PropertyType) IsValid() bool {
	switch p {
	case Apartment, House, Room, Studio:
		return true
	}
	return false
}
