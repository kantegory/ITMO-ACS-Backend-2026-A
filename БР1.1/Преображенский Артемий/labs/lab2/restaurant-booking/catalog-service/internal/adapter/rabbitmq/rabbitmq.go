package rabbitmq

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"

	amqp "github.com/rabbitmq/amqp091-go"
)

const exchangeName = "restaurant.booking"
const routingKeyBookingCreated = "booking.created"
const queueName = "catalog.booking.created"

type bookingCreatedPayload struct {
	ID           uuid.UUID `json:"id"`
	UserID       uuid.UUID `json:"user_id"`
	RestaurantID uuid.UUID `json:"restaurant_id"`
	TableID      uuid.UUID `json:"table_id"`
	GuestsCount  int       `json:"guests_count"`
	StartTime    time.Time `json:"start_time"`
	EndTime      time.Time `json:"end_time"`
	Status       string    `json:"status"`
}

type Consumer struct {
	conn *amqp.Connection
	ch   *amqp.Channel
}

func NewConsumer(url string) (*Consumer, error) {
	conn, err := amqp.Dial(url)
	if err != nil {
		return nil, fmt.Errorf("amqp dial: %w", err)
	}
	ch, err := conn.Channel()
	if err != nil {
		conn.Close()
		return nil, fmt.Errorf("amqp channel: %w", err)
	}
	if err := ch.ExchangeDeclare(
		exchangeName,
		"topic",
		true,
		false,
		false,
		false,
		nil,
	); err != nil {
		ch.Close()
		conn.Close()
		return nil, fmt.Errorf("exchange declare: %w", err)
	}
	if _, err := ch.QueueDeclare(
		queueName,
		true,
		false,
		false,
		false,
		nil,
	); err != nil {
		ch.Close()
		conn.Close()
		return nil, fmt.Errorf("queue declare: %w", err)
	}
	if err := ch.QueueBind(
		queueName,
		routingKeyBookingCreated,
		exchangeName,
		false,
		nil,
	); err != nil {
		ch.Close()
		conn.Close()
		return nil, fmt.Errorf("queue bind: %w", err)
	}
	return &Consumer{conn: conn, ch: ch}, nil
}

func (c *Consumer) Close() error {
	if c.ch != nil {
		c.ch.Close()
	}
	if c.conn != nil {
		return c.conn.Close()
	}
	return nil
}

func (c *Consumer) Run(ctx context.Context) error {
	msgs, err := c.ch.Consume(
		queueName,
		"",
		false,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		return fmt.Errorf("consume: %w", err)
	}
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case d, ok := <-msgs:
			if !ok {
				return nil
			}
			var b bookingCreatedPayload
			if err := json.Unmarshal(d.Body, &b); err != nil {
				log.Printf("rabbitmq: skip message: %v", err)
				d.Nack(false, false)
				continue
			}
			log.Printf("rabbitmq: booking.created id=%s restaurant=%s table=%s", b.ID, b.RestaurantID, b.TableID)
			if err := d.Ack(false); err != nil {
				return err
			}
		}
	}
}
