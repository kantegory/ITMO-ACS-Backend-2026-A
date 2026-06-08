package events

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/segmentio/kafka-go"

	"auth-service/internal/domain"
)

type Publisher interface {
	UserCreated(ctx context.Context, userID uuid.UUID, email string, role domain.Role) error
}

type NoopPublisher struct{}

func (NoopPublisher) UserCreated(context.Context, uuid.UUID, string, domain.Role) error {
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

func (p *KafkaPublisher) UserCreated(ctx context.Context, userID uuid.UUID, email string, role domain.Role) error {
	event := map[string]any{
		"event_type":  "user.created",
		"occurred_at": time.Now().UTC(),
		"producer":    "auth-service",
		"payload": map[string]any{
			"user_id": userID.String(),
			"email":   email,
			"role":    string(role),
		},
	}
	raw, _ := json.Marshal(event)
	return p.writer.WriteMessages(ctx, kafka.Message{
		Key:   []byte(userID.String()),
		Value: raw,
		Time:  time.Now(),
	})
}

func (p *KafkaPublisher) Close() error {
	return p.writer.Close()
}
