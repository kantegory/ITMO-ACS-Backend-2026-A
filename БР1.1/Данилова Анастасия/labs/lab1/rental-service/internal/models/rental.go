package models

import "time"

type Rental struct {
	ID         uint `gorm:"primaryKey"`
	PropertyID uint `gorm:"not null" json:"property_id"`
	TenantID   uint `gorm:"not null" json:"tenant_id"`

	Property Property `gorm:"foreignKey:PropertyID" json:"property,omitempty"`

	StartDate time.Time `gorm:"not null" json:"start_date"`
	EndDate   time.Time `json:"end_date"`

	Status RentalStatus `gorm:"type:varchar(20)"`

	CreatedAt time.Time `json:"created_at"`
}

type RentalStatus string

const (
	Pending   RentalStatus = "PENDING"
	Active    RentalStatus = "ACTIVE"
	Completed RentalStatus = "COMPLETED"
	Canceled  RentalStatus = "CANCELED"
)

func (r RentalStatus) IsValid() bool {
	switch r {
	case Pending, Active, Completed, Canceled:
		return true
	}
	return false
}
