package consumers

import (
	"context"
	"log"

	"rental-platform/services/property-service/internal/services"
	"rental-platform/shared/dto/events"
	"rental-platform/shared/rabbitmq"
)

type UserDeletedConsumer struct {
	Service *services.PropertyService
}

func (c *UserDeletedConsumer) Handle(ctx context.Context, _ string, body []byte) error {
	var payload events.UserDeletedPayload
	if err := rabbitmq.Decode(body, &payload); err != nil {
		return err
	}
	if payload.UserID == 0 {
		return nil
	}
	if err := c.Service.DeactivateByOwner(ctx, payload.UserID); err != nil {
		return err
	}
	log.Printf("deactivated properties for deleted user_id=%d", payload.UserID)
	return nil
}
