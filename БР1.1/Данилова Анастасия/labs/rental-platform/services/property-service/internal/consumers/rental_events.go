package consumers

import (
	"context"
	"log"

	"rental-platform/services/property-service/internal/services"
	"rental-platform/shared/dto/events"
	"rental-platform/shared/rabbitmq"
)

type RentalEventsConsumer struct {
	Service *services.PropertyService
}

func (c *RentalEventsConsumer) Handle(ctx context.Context, routingKey string, body []byte) error {
	switch routingKey {
	case events.RentalCreated:
		var payload events.RentalCreatedPayload
		if err := rabbitmq.Decode(body, &payload); err != nil {
			return err
		}
		if payload.PropertyID == 0 {
			return nil
		}
		if err := c.Service.SetPropertyAvailability(ctx, payload.PropertyID, false); err != nil {
			if err == services.ErrNotFound {
				log.Printf("rental.created: property_id=%d not found", payload.PropertyID)
				return nil
			}
			return err
		}
		log.Printf("property_id=%d marked unavailable (rental.created)", payload.PropertyID)
		return nil

	case events.RentalCompleted:
		var payload events.RentalCompletedPayload
		if err := rabbitmq.Decode(body, &payload); err != nil {
			return err
		}
		if payload.PropertyID == 0 {
			return nil
		}
		if err := c.Service.SetPropertyAvailability(ctx, payload.PropertyID, true); err != nil {
			if err == services.ErrNotFound {
				log.Printf("rental.completed: property_id=%d not found", payload.PropertyID)
				return nil
			}
			return err
		}
		log.Printf("property_id=%d marked available (rental.completed)", payload.PropertyID)
		return nil

	default:
		return nil
	}
}
