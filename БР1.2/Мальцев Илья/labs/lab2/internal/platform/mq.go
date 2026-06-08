package platform

import (
	"context"
	"encoding/json"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

const EventsExchange = "job_search.events"

type EventMessage struct {
	Type       string          `json:"type"`
	OccurredAt time.Time       `json:"occurred_at"`
	Payload    json.RawMessage `json:"payload"`
}

type EventPublisher interface {
	Publish(ctx context.Context, eventType string, payload any) error
}

type EventConsumer interface {
	Consume(ctx context.Context, queueName string, eventTypes []string, handler func(EventMessage) error) error
}

type NoopPublisher struct{}

func (NoopPublisher) Publish(_ context.Context, _ string, _ any) error {
	return nil
}

type NoopConsumer struct{}

func (NoopConsumer) Consume(_ context.Context, _ string, _ []string, _ func(EventMessage) error) error {
	return nil
}

type RabbitMQ struct {
	connection *amqp.Connection
	channel    *amqp.Channel
	exchange   string
}

func NewRabbitMQ(url string) (*RabbitMQ, error) {
	connection, err := amqp.Dial(url)
	if err != nil {
		return nil, err
	}

	channel, err := connection.Channel()
	if err != nil {
		_ = connection.Close()
		return nil, err
	}

	if err := channel.ExchangeDeclare(EventsExchange, "topic", true, false, false, false, nil); err != nil {
		_ = channel.Close()
		_ = connection.Close()
		return nil, err
	}

	return &RabbitMQ{
		connection: connection,
		channel:    channel,
		exchange:   EventsExchange,
	}, nil
}

func (mq *RabbitMQ) Publish(ctx context.Context, eventType string, payload any) error {
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	message := EventMessage{
		Type:       eventType,
		OccurredAt: time.Now().UTC(),
		Payload:    payloadBytes,
	}

	body, err := json.Marshal(message)
	if err != nil {
		return err
	}

	return mq.channel.PublishWithContext(
		ctx,
		mq.exchange,
		eventType,
		false,
		false,
		amqp.Publishing{
			ContentType:  "application/json",
			DeliveryMode: amqp.Persistent,
			Timestamp:    message.OccurredAt,
			Type:         eventType,
			Body:         body,
		},
	)
}

func (mq *RabbitMQ) Consume(ctx context.Context, queueName string, eventTypes []string, handler func(EventMessage) error) error {
	queue, err := mq.channel.QueueDeclare(queueName, true, false, false, false, nil)
	if err != nil {
		return err
	}

	for _, eventType := range eventTypes {
		if err := mq.channel.QueueBind(queue.Name, eventType, mq.exchange, false, nil); err != nil {
			return err
		}
	}

	deliveries, err := mq.channel.Consume(queue.Name, "", false, false, false, false, nil)
	if err != nil {
		return err
	}

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case delivery, ok := <-deliveries:
			if !ok {
				return nil
			}

			var message EventMessage
			if err := json.Unmarshal(delivery.Body, &message); err != nil {
				_ = delivery.Nack(false, false)
				continue
			}

			if err := handler(message); err != nil {
				_ = delivery.Nack(false, true)
				continue
			}

			_ = delivery.Ack(false)
		}
	}
}

func (mq *RabbitMQ) Close() error {
	if mq.channel != nil {
		_ = mq.channel.Close()
	}
	if mq.connection != nil {
		return mq.connection.Close()
	}
	return nil
}
