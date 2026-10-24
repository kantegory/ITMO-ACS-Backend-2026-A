package rabbitmq

import (
	"context"
	"encoding/json"
	"log"

	amqp "github.com/rabbitmq/amqp091-go"
)

type HandlerFunc func(ctx context.Context, routingKey string, body []byte) error

func Consume(ctx context.Context, ch *amqp.Channel, queue string, handler HandlerFunc) error {
	msgs, err := ch.Consume(queue, "", false, false, false, false, nil)
	if err != nil {
		return err
	}

	go func() {
		for {
			select {
			case <-ctx.Done():
				return
			case msg, ok := <-msgs:
				if !ok {
					return
				}
				if err := handler(ctx, msg.RoutingKey, msg.Body); err != nil {
					log.Printf("rabbitmq handler error queue=%s key=%s: %v", queue, msg.RoutingKey, err)
					_ = msg.Nack(false, true)
					continue
				}
				_ = msg.Ack(false)
			}
		}
	}()
	return nil
}

func Decode(body []byte, dest any) error {
	return json.Unmarshal(body, dest)
}
