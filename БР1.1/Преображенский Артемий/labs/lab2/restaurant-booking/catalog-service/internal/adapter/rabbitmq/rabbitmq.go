package rabbitmq

import (
	"context"
	"fmt"

	amqp "github.com/rabbitmq/amqp091-go"
)

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

func (c *Consumer) DeclareTopicExchange(name string) error {
	return c.ch.ExchangeDeclare(
		name,
		"topic",
		true,
		false,
		false,
		false,
		nil,
	)
}

func (c *Consumer) DeclareQueue(name string) (amqp.Queue, error) {
	return c.ch.QueueDeclare(
		name,
		true,
		false,
		false,
		false,
		nil,
	)
}

func (c *Consumer) BindQueue(queue string, exchange string, routingKey string) error {
	return c.ch.QueueBind(queue, routingKey, exchange, false, nil)
}

func (c *Consumer) Consume(ctx context.Context, queue string, handler func(context.Context, []byte) error) error {
	msgs, err := c.ch.Consume(
		queue,
		"",
		false,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		return err
	}

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case msg, ok := <-msgs:
			if !ok {
				return fmt.Errorf("consumer closed")
			}
			if err := handler(ctx, msg.Body); err != nil {
				msg.Nack(false, false)
				continue
			}
			msg.Ack(false)
		}
	}
}

