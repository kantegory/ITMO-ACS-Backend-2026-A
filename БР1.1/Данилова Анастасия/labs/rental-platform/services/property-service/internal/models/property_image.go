package models

type PropertyImage struct {
	ID         uint   `gorm:"primaryKey" json:"id"`
	PropertyID uint   `gorm:"not null;index" json:"property_id"`
	ImageURL   string `gorm:"not null" json:"image_url"`
}
