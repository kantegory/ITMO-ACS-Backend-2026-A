package models

import "time"

type Rental struct {
	ID         uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	TenantID   uint      `gorm:"not null;index" json:"tenant_id"`
	PropertyID uint      `gorm:"not null;index" json:"property_id"`
	OwnerID    uint      `gorm:"not null;index" json:"owner_id"`
	StartDate  time.Time `gorm:"type:date;not null" json:"start_date"`
	EndDate    time.Time `gorm:"type:date;not null" json:"end_date"`
	TotalPrice float64   `gorm:"type:decimal(12,2);not null" json:"total_price"`
	Status     string    `gorm:"type:varchar(20);default:'pending';check:status IN ('pending', 'confirmed', 'paid', 'payment_pending', 'cancelled', 'finished')" json:"status"`
	CreatedAt  time.Time `gorm:"autoCreateTime" json:"created_at"`
}

func (Rental) TableName() string { return "rentals" }