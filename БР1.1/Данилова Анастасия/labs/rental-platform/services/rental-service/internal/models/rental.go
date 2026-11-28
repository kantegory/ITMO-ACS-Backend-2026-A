package models

import "time"

type RentalStatus string

const (
	StatusPending   RentalStatus = "PENDING"
	StatusApproved  RentalStatus = "APPROVED"
	StatusRejected  RentalStatus = "REJECTED"
	StatusActive    RentalStatus = "ACTIVE"
	StatusCompleted RentalStatus = "COMPLETED"
	StatusCancelled RentalStatus = "CANCELLED"
)

type Rental struct {
	ID         uint         `gorm:"primaryKey" json:"id"`
	PropertyID uint         `gorm:"not null;index" json:"property_id"`
	TenantID   uint         `gorm:"not null;index" json:"tenant_id"`
	LandlordID uint         `gorm:"not null;index" json:"landlord_id"`
	StartDate  time.Time    `gorm:"type:date;not null" json:"start_date"`
	EndDate    time.Time    `gorm:"type:date;not null" json:"end_date"`
	TotalPrice int          `gorm:"not null" json:"total_price"`
	Status     RentalStatus `gorm:"type:varchar(20);not null;index" json:"status"`
	CreatedAt  time.Time    `json:"created_at"`
	UpdatedAt  time.Time    `json:"updated_at"`
}

func (Rental) TableName() string {
	return "rentals"
}
