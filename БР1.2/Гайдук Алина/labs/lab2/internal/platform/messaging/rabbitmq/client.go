package rabbitmq

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"strings"
	"sync"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

type Client struct {
	mu                 sync.Mutex
	conn               *amqp.Connection
	channel            *amqp.Channel
	returns            chan amqp.Return
	url                string
	exchange           string
	deadLetterExchange string
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

	client := &Client{
		url:                url,
		exchange:           exchange,
		deadLetterExchange: exchange + ".dlx",
	}
	if err := client.connectLocked(); err != nil {
		return nil, err
	}

	return client, nil
}

func (c *Client) connectLocked() error {
	conn, err := amqp.Dial(c.url)
	if err != nil {
		return err
	}

	ch, err := conn.Channel()
	if err != nil {
		_ = conn.Close()
		return err
	}

	if err := ch.ExchangeDeclare(
		c.exchange,
		"topic",
		true,
		false,
		false,
		false,
		nil,
	); err != nil {
		_ = ch.Close()
		_ = conn.Close()
		return err
	}

	if err := ch.ExchangeDeclare(
		c.deadLetterExchange,
		"topic",
		true,
		false,
		false,
		false,
		nil,
	); err != nil {
		_ = ch.Close()
		_ = conn.Close()
		return err
	}

	if err := ch.Confirm(false); err != nil {
		_ = ch.Close()
		_ = conn.Close()
		return err
	}

	c.conn = conn
	c.channel = ch
	c.returns = ch.NotifyReturn(make(chan amqp.Return, 10))

	return nil
}

func (c *Client) Close() error {
	if c == nil {
		return nil
	}
	c.mu.Lock()
	defer c.mu.Unlock()

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

	c.mu.Lock()
	defer c.mu.Unlock()

	if err := c.publishLocked(ctx, routingKey, payload); err != nil {
		slog.Warn("rabbitmq publish failed, reconnecting", "exchange", c.exchange, "routing_key", routingKey, "error", err)
		if reconnectErr := c.reconnectLocked(); reconnectErr != nil {
			return fmt.Errorf("publish: %w; reconnect: %w", err, reconnectErr)
		}

		return c.publishLocked(ctx, routingKey, payload)
	}

	return nil
}

func (c *Client) publishLocked(ctx context.Context, routingKey string, payload []byte) error {
	if c.channel == nil {
		return errors.New("rabbitmq channel is closed")
	}

	_ = drainReturns(c.returns)
	confirmation, err := c.channel.PublishWithDeferredConfirmWithContext(
		ctx,
		c.exchange,
		routingKey,
		true,
		false,
		amqp.Publishing{
			ContentType:  "application/json",
			DeliveryMode: amqp.Persistent,
			Timestamp:    time.Now().UTC(),
			Body:         payload,
		},
	)
	if err != nil {
		return err
	}
	if confirmation == nil {
		return errors.New("publisher confirmation was not registered")
	}

	acked, err := confirmation.WaitContext(ctx)
	if err != nil {
		return err
	}
	returned := drainReturns(c.returns)
	if len(returned) > 0 {
		item := returned[0]
		return fmt.Errorf("message returned by broker: exchange=%s routing_key=%s reply=%s", item.Exchange, item.RoutingKey, item.ReplyText)
	}
	if !acked {
		return errors.New("message was not acknowledged by broker")
	}

	return nil
}

func drainReturns(returns <-chan amqp.Return) []amqp.Return {
	out := make([]amqp.Return, 0)
	for {
		select {
		case returned, ok := <-returns:
			if !ok {
				return out
			}
			out = append(out, returned)
		default:
			return out
		}
	}
}

func (c *Client) StartConsumer(ctx context.Context, queueName string, routingKeys []string, handler func(context.Context, Delivery) error) error {
	c.mu.Lock()
	deliveries, queue, err := c.startDeliveriesLocked(queueName, routingKeys)
	c.mu.Unlock()
	if err != nil {
		return err
	}

	go c.consumeLoop(ctx, queueName, routingKeys, handler, deliveries, queue.Name)

	return nil
}

func (c *Client) startDeliveriesLocked(queueName string, routingKeys []string) (<-chan amqp.Delivery, amqp.Queue, error) {
	queue, err := c.channel.QueueDeclare(
		queueName,
		true,
		false,
		false,
		false,
		amqp.Table{"x-dead-letter-exchange": c.deadLetterExchange},
	)
	if err != nil {
		return nil, amqp.Queue{}, err
	}

	dlq, err := c.channel.QueueDeclare(
		queueName+".dlq",
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		return nil, amqp.Queue{}, err
	}
	if err := c.channel.QueueBind(dlq.Name, "#", c.deadLetterExchange, false, nil); err != nil {
		return nil, amqp.Queue{}, err
	}

	for _, key := range routingKeys {
		if err := c.channel.QueueBind(queue.Name, key, c.exchange, false, nil); err != nil {
			return nil, amqp.Queue{}, err
		}
	}

	if err := c.channel.Qos(10, 0, false); err != nil {
		return nil, amqp.Queue{}, err
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
		return nil, amqp.Queue{}, err
	}

	return deliveries, queue, nil
}

func (c *Client) consumeLoop(ctx context.Context, queueName string, routingKeys []string, handler func(context.Context, Delivery) error, deliveries <-chan amqp.Delivery, activeQueue string) {
	for {
		if c.consumeDeliveries(ctx, handler, deliveries, activeQueue) {
			return
		}

		slog.Warn("rabbitmq consumer stopped, reconnecting", "queue", queueName)
		for {
			if ctx.Err() != nil {
				return
			}

			c.mu.Lock()
			err := c.reconnectLocked()
			if err == nil {
				nextDeliveries, queue, err := c.startDeliveriesLocked(queueName, routingKeys)
				if err == nil {
					deliveries = nextDeliveries
					activeQueue = queue.Name
					c.mu.Unlock()
					break
				}
			}
			c.mu.Unlock()

			slog.Error("rabbitmq consumer reconnect failed", "queue", queueName, "error", err)
			select {
			case <-ctx.Done():
				return
			case <-time.After(2 * time.Second):
			}
		}
	}
}

func (c *Client) consumeDeliveries(ctx context.Context, handler func(context.Context, Delivery) error, deliveries <-chan amqp.Delivery, queueName string) bool {
	for {
		select {
		case <-ctx.Done():
			return true
		case delivery, ok := <-deliveries:
			if !ok {
				return false
			}
			if err := handler(ctx, Delivery{RoutingKey: delivery.RoutingKey, Body: delivery.Body}); err != nil {
				slog.Error("message handler failed", "queue", queueName, "routing_key", delivery.RoutingKey, "error", err)
				_ = delivery.Nack(false, false)
				continue
			}
			_ = delivery.Ack(false)
		}
	}
}

func (c *Client) reconnectLocked() error {
	if c.channel != nil {
		_ = c.channel.Close()
	}
	if c.conn != nil {
		_ = c.conn.Close()
	}

	return c.connectLocked()
}
