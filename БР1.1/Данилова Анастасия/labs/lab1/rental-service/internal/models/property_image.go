package models

type PropertyImage struct {
	ID         uint   `gorm:"primaryKey"`
	PropertyID uint   `json:"property_id"`
	ImageURL   string `json:"image_url"`
}
