package models

import "time"

type Message struct {
	ID          uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	SenderID    int       `gorm:"not null" json:"sender_id"`
	ReceiverID  int       `gorm:"not null" json:"receiver_id"`
	PropertyID  int       `gorm:"not null" json:"property_id"`
	MessageText string    `gorm:"type:text;not null" json:"message_text"`
	SentAt      time.Time `gorm:"autoCreateTime" json:"sent_at"`
}

func (Message) TableName() string { return "messages" }