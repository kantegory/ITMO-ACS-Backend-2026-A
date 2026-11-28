package rabbitmq

import (
	"rental-platform/shared/dto/events"

	amqp "github.com/rabbitmq/amqp091-go"
)

func DeclareTopology(ch *amqp.Channel) error {
	if err := ch.ExchangeDeclare(events.ExchangeName, "topic", true, false, false, false, nil); err != nil {
		return err
	}
	return nil
}

func DeclareQueue(ch *amqp.Channel, name string, routingKeys ...string) error {
	if _, err := ch.QueueDeclare(name, true, false, false, false, nil); err != nil {
		return err
	}
	for _, key := range routingKeys {
		if err := ch.QueueBind(name, key, events.ExchangeName, false, nil); err != nil {
			return err
		}
	}
	return nil
}
