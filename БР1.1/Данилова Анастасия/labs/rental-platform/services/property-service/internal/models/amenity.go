package models

type Amenity struct {
	ID   uint   `gorm:"primaryKey" json:"id"`
	Name string `gorm:"uniqueIndex;not null" json:"name"`
}

type PropertyAmenity struct {
	PropertyID uint `gorm:"primaryKey" json:"property_id"`
	AmenityID  uint `gorm:"primaryKey" json:"amenity_id"`
}
