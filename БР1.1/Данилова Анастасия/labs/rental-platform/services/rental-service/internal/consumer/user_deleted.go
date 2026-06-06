package consumer

import (
	"context"
	"log"

	"rental-platform/services/rental-service/internal/services"
	"rental-platform/shared/dto/events"
	"rental-platform/shared/rabbitmq"
)

const QueueName = "rental-service.user-deleted"

type UserDeletedConsumer struct {
	Service *services.RentalService
}

func (c *UserDeletedConsumer) Handle(ctx context.Context, routingKey string, body []byte) error {
	if routingKey != events.UserDeleted {
		return nil
	}

	var payload events.UserDeletedPayload
	if err := rabbitmq.Decode(body, &payload); err != nil {
		return err
	}

	if err := c.Service.HandleUserDeleted(ctx, payload.UserID); err != nil {
		return err
	}
	log.Printf("cancelled rentals for deleted user_id=%d", payload.UserID)
	return nil
}
