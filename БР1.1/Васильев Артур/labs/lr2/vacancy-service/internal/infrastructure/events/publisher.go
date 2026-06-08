package events

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/segmentio/kafka-go"
)

type Publisher interface {
	VacancyPublished(ctx context.Context, vacancyID, employerUserID uuid.UUID, title string) error
}

type NoopPublisher struct{}

func (NoopPublisher) VacancyPublished(context.Context, uuid.UUID, uuid.UUID, string) error {
	return nil
}

type KafkaPublisher struct {
	writer *kafka.Writer
}

func NewKafkaPublisher(broker, topic string) *KafkaPublisher {
	return &KafkaPublisher{
		writer: &kafka.Writer{
			Addr:                   kafka.TCP(broker),
			Topic:                  topic,
			Balancer:               &kafka.LeastBytes{},
			AllowAutoTopicCreation: true,
		},
	}
}

func (p *KafkaPublisher) VacancyPublished(ctx context.Context, vacancyID, employerUserID uuid.UUID, title string) error {
	event := map[string]any{
		"event_type":  "vacancy.published",
		"occurred_at": time.Now().UTC(),
		"producer":    "vacancy-service",
		"payload": map[string]any{
			"vacancy_id":       vacancyID.String(),
			"employer_user_id": employerUserID.String(),
			"title":            title,
		},
	}
	raw, _ := json.Marshal(event)
	return p.writer.WriteMessages(ctx, kafka.Message{
		Key:   []byte(vacancyID.String()),
		Value: raw,
		Time:  time.Now(),
	})
}

func (p *KafkaPublisher) Close() error {
	return p.writer.Close()
}
