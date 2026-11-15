package models

import "time"

type Transaction struct {
	ID             uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	RentalID       int       `gorm:"not null" json:"rental_id"`
	TenantID       int       `gorm:"not null" json:"tenant_id"`
	Amount         float64   `gorm:"type:decimal(12,2);not null" json:"amount"`
	PaymentMethod  string    `gorm:"type:varchar(50);not null" json:"payment_method"`
	IdempotencyKey string   `gorm:"type:varchar(64);uniqueIndex" json:"idempotency_key"`
	Type           string    `gorm:"type:varchar(20);default:'payment';check:type IN ('payment', 'refund')" json:"type"`
	Status         string    `gorm:"type:varchar(20);default:'success';check:status IN ('success', 'failed', 'pending', 'refunded')" json:"status"`
	CreatedAt      time.Time `gorm:"autoCreateTime" json:"created_at"`
}

func (Transaction) TableName() string { return "transactions" }