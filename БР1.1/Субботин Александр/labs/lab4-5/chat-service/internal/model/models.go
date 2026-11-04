package model

import "time"

type Chat struct {
	ID         string    `json:"id"`
	PropertyID *string   `json:"property_id,omitempty"`
	BookingID  *string   `json:"booking_id,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
}

type Message struct {
	ID        string    `json:"id"`
	ChatID    string    `json:"chat_id"`
	SenderID  string    `json:"sender_id"`
	Text      string    `json:"text"`
	CreatedAt time.Time `json:"created_at"`
	IsRead    bool      `json:"is_read"`
}
