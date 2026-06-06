package models

import "time"

type Property struct {
	ID      uint `gorm:"primaryKey" json:"id"`
	OwnerID uint `gorm:"not null;index" json:"owner_id"`

	Title       string       `gorm:"not null" json:"title"`
	PropertyType PropertyType `gorm:"column:property_type;type:varchar(20);not null" json:"property_type"`
	City        string       `json:"city"`
	Address     string       `json:"address"`
	Description string       `json:"description"`

	PricePerMonth int  `gorm:"not null" json:"price_per_month"`
	IsVerified    bool `gorm:"not null;default:false" json:"is_verified"`
	IsAvailable   bool `gorm:"not null;default:true" json:"is_available"`

	Amenities []Amenity       `gorm:"many2many:property_amenities;constraint:OnDelete:CASCADE" json:"amenities,omitempty"`
	Images    []PropertyImage `gorm:"foreignKey:PropertyID;constraint:OnDelete:CASCADE" json:"images,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type PropertyType string

const (
	PropertyTypeApartment PropertyType = "APARTMENT"
	PropertyTypeHouse     PropertyType = "HOUSE"
	PropertyTypeRoom      PropertyType = "ROOM"
	PropertyTypeStudio    PropertyType = "STUDIO"
)

func (p PropertyType) IsValid() bool {
	switch p {
	case PropertyTypeApartment, PropertyTypeHouse, PropertyTypeRoom, PropertyTypeStudio:
		return true
	default:
		return false
	}
}
