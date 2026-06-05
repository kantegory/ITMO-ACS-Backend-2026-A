package rabbitconsumer

import (
	"context"
	"encoding/json"

	eventsdomain "recipehub/internal/domain/events"
	"recipehub/internal/platform/messaging/rabbitmq"
)

func Start(ctx context.Context, client *rabbitmq.Client, queueName string, routingKeys []string, handler func(context.Context, eventsdomain.Envelope) error) error {
	return client.StartConsumer(ctx, queueName, routingKeys, func(ctx context.Context, delivery rabbitmq.Delivery) error {
		var event eventsdomain.Envelope
		if err := json.Unmarshal(delivery.Body, &event); err != nil {
			return err
		}

		return handler(ctx, event)
	})
}
