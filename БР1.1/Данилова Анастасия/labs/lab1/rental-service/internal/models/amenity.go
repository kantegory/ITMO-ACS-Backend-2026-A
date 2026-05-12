package models

type Amenity struct {
	ID   uint   `gorm:"primaryKey"`
	Name string `gorm:"unique;not null"`
}

type PropertyAmenity struct {
	PropertyID uint `gorm:"primaryKey" json:"property_id"`
	AmenityID  uint `gorm:"not null" json:"amenity_id"`
}
