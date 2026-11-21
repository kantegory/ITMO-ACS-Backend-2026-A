package models

import "time"

type OutboxEvent struct {
	ID            uint       `gorm:"primaryKey;autoIncrement" json:"id"`
	AggregateType string     `gorm:"type:varchar(100);not null" json:"aggregate_type"`
	AggregateID   uint       `gorm:"not null" json:"aggregate_id"`
	EventType     string     `gorm:"type:varchar(100);not null" json:"event_type"`
	Payload       string     `gorm:"type:jsonb;not null" json:"payload"`
	CreatedAt     time.Time  `gorm:"autoCreateTime" json:"created_at"`
	PublishedAt   *time.Time `json:"published_at,omitempty"`
	RetryCount    int        `gorm:"default:0" json:"retry_count"`
	Status        string     `gorm:"type:varchar(20);default:'pending'" json:"status"`
}

func (OutboxEvent) TableName() string { return "outbox_events" }
