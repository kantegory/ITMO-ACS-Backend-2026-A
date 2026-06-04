package rabbitpublisher

import (
	"context"

	eventsdomain "recipehub/internal/domain/events"
	"recipehub/internal/platform/messaging/rabbitmq"
)

type Publisher struct {
	client *rabbitmq.Client
}

func New(client *rabbitmq.Client) *Publisher {
	return &Publisher{client: client}
}

func (p *Publisher) Publish(ctx context.Context, event eventsdomain.Envelope) error {
	return p.client.PublishJSON(ctx, event.EventType, event)
}
