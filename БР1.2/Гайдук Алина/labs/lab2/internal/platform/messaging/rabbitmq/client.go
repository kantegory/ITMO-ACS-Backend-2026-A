package rabbitmq

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"strings"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

type Client struct {
	conn     *amqp.Connection
	channel  *amqp.Channel
	exchange string
}

type Delivery struct {
	RoutingKey string
	Body       []byte
}

func Dial(url, exchange string) (*Client, error) {
	url = strings.TrimSpace(url)
	exchange = strings.TrimSpace(exchange)
	if url == "" {
		return nil, errors.New("rabbitmq url is empty")
	}
	if exchange == "" {
		return nil, errors.New("rabbitmq exchange is empty")
	}

	conn, err := amqp.Dial(url)
	if err != nil {
		return nil, err
	}

	ch, err := conn.Channel()
	if err != nil {
		_ = conn.Close()
		return nil, err
	}

	err = ch.ExchangeDeclare(
		exchange,
		"topic",
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		_ = ch.Close()
		_ = conn.Close()
		return nil, err
	}

	return &Client{conn: conn, channel: ch, exchange: exchange}, nil
}

func (c *Client) Close() error {
	if c == nil {
		return nil
	}
	if c.channel != nil {
		_ = c.channel.Close()
	}
	if c.conn != nil {
		return c.conn.Close()
	}

	return nil
}

func (c *Client) PublishJSON(ctx context.Context, routingKey string, body any) error {
	payload, err := json.Marshal(body)
	if err != nil {
		return err
	}

	return c.channel.PublishWithContext(
		ctx,
		c.exchange,
		routingKey,
		false,
		false,
		amqp.Publishing{
			ContentType:  "application/json",
			DeliveryMode: amqp.Persistent,
			Timestamp:    time.Now().UTC(),
			Body:         payload,
		},
	)
}

func (c *Client) StartConsumer(ctx context.Context, queueName string, routingKeys []string, handler func(context.Context, Delivery) error) error {
	queue, err := c.channel.QueueDeclare(
		queueName,
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		return err
	}

	for _, key := range routingKeys {
		if err := c.channel.QueueBind(queue.Name, key, c.exchange, false, nil); err != nil {
			return err
		}
	}

	deliveries, err := c.channel.Consume(
		queue.Name,
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

	go func() {
		for {
			select {
			case <-ctx.Done():
				return
			case delivery, ok := <-deliveries:
				if !ok {
					return
				}
				if err := handler(ctx, Delivery{RoutingKey: delivery.RoutingKey, Body: delivery.Body}); err != nil {
					slog.Error("message handler failed", "queue", queue.Name, "routing_key", delivery.RoutingKey, "error", err)
					_ = delivery.Nack(false, true)
					continue
				}
				_ = delivery.Ack(false)
			}
		}
	}()

	return nil
}
