package models

import "time"

type Chat struct {
	ID         uint `gorm:"primaryKey"`
	TenantID   uint `gorm:"not null" json:"tenant_id"`
	LandlordID uint `gorm:"not null" json:"landlord_id"`
	PropertyID uint `gorm:"not null" json:"property_id"`

	Property Property `gorm:"foreignKey:PropertyID" json:"property,omitempty"`

	CreatedAt time.Time `json:"created_at"`
}
