package kafka

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"auth-service/internal/repositories"
)

type OutboxEventDTO struct {
	EventID       string      `json:"event_id"`
	EventType     string      `json:"event_type"`
	AggregateType string      `json:"aggregate_type"`
	AggregateID   uint        `json:"aggregate_id"`
	Timestamp     string      `json:"timestamp"`
	Data          interface{} `json:"data"`
	Source        string      `json:"source"`
}

type OutboxProcessor struct {
	repo      *repositories.OutboxRepository
	producers map[string]*Producer
	interval  time.Duration
}

func NewOutboxProcessor(repo *repositories.OutboxRepository, producers map[string]*Producer) *OutboxProcessor {
	return &OutboxProcessor{
		repo:      repo,
		producers: producers,
		interval:  1 * time.Second,
	}
}

func (p *OutboxProcessor) Start(ctx context.Context) {
	ticker := time.NewTicker(p.interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Println("Outbox processor stopped")
			return
		case <-ticker.C:
			p.processOutbox()
		}
	}
}

func (p *OutboxProcessor) processOutbox() {
	events, err := p.repo.FindPending()
	if err != nil {
		log.Printf("Failed to fetch pending outbox events: %v", err)
		return
	}

	for _, event := range events {
		var dto OutboxEventDTO
		if err := json.Unmarshal([]byte(event.Payload), &dto); err != nil {
			log.Printf("Failed to unmarshal outbox event payload: %v", err)
			continue
		}

		producer, ok := p.producers[TopicUserEvents]
		if !ok {
			log.Printf("No producer for topic user.events")
			continue
		}

		key := dto.AggregateType + ":" + string(rune(dto.AggregateID))
		if err := producer.Publish(key, dto); err != nil {
			log.Printf("Failed to publish outbox event %s: %v", event.EventType, err)
			_ = p.repo.IncrementRetry(event.ID)
			continue
		}

		if err := p.repo.MarkPublished(event.ID); err != nil {
			log.Printf("Failed to mark outbox event as published: %v", err)
		}
	}
}
