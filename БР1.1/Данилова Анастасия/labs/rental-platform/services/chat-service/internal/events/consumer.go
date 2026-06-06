package events

import (
	"context"
	"log"

	"rental-platform/services/chat-service/internal/services"
	"rental-platform/shared/dto/events"
	"rental-platform/shared/rabbitmq"

	amqp "github.com/rabbitmq/amqp091-go"
)

const queueName = "chat-service.events"

func StartConsumer(ctx context.Context, ch *amqp.Channel, svc *services.ChatService) error {
	if err := rabbitmq.DeclareQueue(ch, queueName, events.UserDeleted, events.RentalCreated); err != nil {
		return err
	}

	return rabbitmq.Consume(ctx, ch, queueName, func(ctx context.Context, routingKey string, body []byte) error {
		switch routingKey {
		case events.UserDeleted:
			var payload events.UserDeletedPayload
			if err := rabbitmq.Decode(body, &payload); err != nil {
				return err
			}
			if err := svc.ArchiveChatsForUser(payload.UserID); err != nil {
				return err
			}
			log.Printf("archived chats for deleted user_id=%d", payload.UserID)

		case events.RentalCreated:
			var payload events.RentalCreatedPayload
			if err := rabbitmq.Decode(body, &payload); err != nil {
				return err
			}
			if _, err := svc.EnsureChat(ctx, payload.PropertyID, payload.TenantID, payload.LandlordID); err != nil {
				return err
			}
			log.Printf("ensured chat for rental_id=%d property_id=%d", payload.RentalID, payload.PropertyID)
		}
		return nil
	})
}
