package events

import (
	"context"
	"encoding/json"

	"github.com/google/uuid"
	"github.com/segmentio/kafka-go"

	"profile-service/internal/domain"
	profileuc "profile-service/internal/usecase/profile"
	"profile-service/pkg/slogutil"
)

const component = "user_created_consumer"

type UserCreatedConsumer struct {
	reader *kafka.Reader
	uc     *profileuc.UseCase
}

func NewUserCreatedConsumer(broker, topic, groupID string, uc *profileuc.UseCase) *UserCreatedConsumer {
	return &UserCreatedConsumer{
		reader: kafka.NewReader(kafka.ReaderConfig{
			Brokers: []string{broker},
			Topic:   topic,
			GroupID: groupID,
		}),
		uc: uc,
	}
}

func (c *UserCreatedConsumer) Start(ctx context.Context) {
	slogutil.LogInfo(ctx, slogutil.LayerEvents, component, "consumer started")
	for {
		msg, err := c.reader.ReadMessage(ctx)
		if err != nil {
			if ctx.Err() != nil {
				return
			}
			slogutil.LogError(ctx, slogutil.LayerEvents, component, "read message failed", err)
			continue
		}
		if err := c.handleMessage(ctx, msg.Value); err != nil {
			slogutil.LogError(ctx, slogutil.LayerEvents, component, "handle message failed", err)
		}
	}
}

func (c *UserCreatedConsumer) handleMessage(ctx context.Context, raw []byte) error {
	var envelope struct {
		Payload struct {
			UserID string `json:"user_id"`
			Role   string `json:"role"`
		} `json:"payload"`
	}
	if err := json.Unmarshal(raw, &envelope); err != nil {
		return err
	}
	uid, err := uuid.Parse(envelope.Payload.UserID)
	if err != nil {
		return err
	}
	return c.uc.HandleUserCreated(ctx, uid, domain.Role(envelope.Payload.Role), "", "")
}

func (c *UserCreatedConsumer) Close() error {
	return c.reader.Close()
}
