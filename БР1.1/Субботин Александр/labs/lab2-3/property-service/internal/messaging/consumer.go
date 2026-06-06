package messaging

import (
	"encoding/json"
	"fmt"
	"log"

	amqp "github.com/rabbitmq/amqp091-go"
)

type Consumer struct {
	conn    *amqp.Connection
	channel *amqp.Channel
}

type BookingEvent struct {
	EventType  string  `json:"event_type"`
	BookingID  string  `json:"booking_id"`
	PropertyID string  `json:"property_id"`
	TenantID   string  `json:"tenant_id"`
	Status     string  `json:"status"`
	PriceTotal float64 `json:"price_total"`
}

func NewConsumer(amqpURL string) (*Consumer, error) {
	conn, err := amqp.Dial(amqpURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to RabbitMQ: %w", err)
	}

	ch, err := conn.Channel()
	if err != nil {
		conn.Close()
		return nil, fmt.Errorf("failed to open channel: %w", err)
	}

	err = ch.ExchangeDeclare(
		"booking_events",
		"fanout",
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		ch.Close()
		conn.Close()
		return nil, fmt.Errorf("failed to declare exchange: %w", err)
	}

	q, err := ch.QueueDeclare(
		"property_booking_events",
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		ch.Close()
		conn.Close()
		return nil, fmt.Errorf("failed to declare queue: %w", err)
	}

	err = ch.QueueBind(q.Name, "", "booking_events", false, nil)
	if err != nil {
		ch.Close()
		conn.Close()
		return nil, fmt.Errorf("failed to bind queue: %w", err)
	}

	log.Println("property-service: connected to RabbitMQ")
	return &Consumer{conn: conn, channel: ch}, nil
}

func (c *Consumer) StartConsuming(handler func(BookingEvent)) error {
	msgs, err := c.channel.Consume(
		"property_booking_events",
		"",
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		return fmt.Errorf("failed to start consuming: %w", err)
	}

	go func() {
		for msg := range msgs {
			var event BookingEvent
			if err := json.Unmarshal(msg.Body, &event); err != nil {
				log.Printf("failed to unmarshal event: %v", err)
				continue
			}
			handler(event)
		}
	}()

	return nil
}

func (c *Consumer) Close() {
	if c.channel != nil {
		c.channel.Close()
	}
	if c.conn != nil {
		c.conn.Close()
	}
}
