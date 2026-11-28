package models

import "time"

type Chat struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	PropertyID uint      `gorm:"index:idx_chat_property_tenant,unique;not null" json:"property_id"`
	TenantID   uint      `gorm:"index:idx_chat_property_tenant,unique;not null" json:"tenant_id"`
	LandlordID uint      `gorm:"not null" json:"landlord_id"`
	IsArchived bool      `gorm:"default:false;not null" json:"is_archived"`
	CreatedAt  time.Time `json:"created_at"`
}

type Message struct {
	ID        uint       `gorm:"primaryKey" json:"id"`
	ChatID    uint       `gorm:"index;not null" json:"chat_id"`
	SenderID  uint       `gorm:"not null" json:"sender_id"`
	Text      string     `gorm:"type:text;not null" json:"text"`
	IsRead    bool       `gorm:"default:false;not null" json:"is_read"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt *time.Time `json:"updated_at"`
}
