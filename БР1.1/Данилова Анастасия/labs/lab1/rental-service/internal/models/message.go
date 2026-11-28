package models

import "time"

type Message struct {
	ID       uint `gorm:"primaryKey"`
	ChatID   uint `gorm:"not null" json:"chat_id"`
	SenderID uint `gorm:"not null" json:"sender_id"`

	Text string `gorm:"not null" json:"text"`

	CreatedAt time.Time `json:"created_at"`
}
