package messaging

import (
	"encoding/json"
	"fmt"
	"log"

	amqp "github.com/rabbitmq/amqp091-go"
)

type Publisher struct {
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

func NewPublisher(amqpURL string) (*Publisher, error) {
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

	log.Println("booking-service: connected to RabbitMQ")
	return &Publisher{conn: conn, channel: ch}, nil
}

func (p *Publisher) PublishBookingEvent(event BookingEvent) error {
	body, err := json.Marshal(event)
	if err != nil {
		return err
	}

	return p.channel.Publish(
		"booking_events",
		"",
		false,
		false,
		amqp.Publishing{
			ContentType: "application/json",
			Body:        body,
		},
	)
}

func (p *Publisher) Close() {
	if p.channel != nil {
		p.channel.Close()
	}
	if p.conn != nil {
		p.conn.Close()
	}
}
