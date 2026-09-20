package create

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"restaurant-booking/catalog-service/internal/adapter/rabbitmq"
	"restaurant-booking/catalog-service/internal/domain"
)

const RabbitUserExchangeName = "restaurant.user"
const RabbitUserRoutingKey = "user.registered"
const RabbitUserCatalogQueueName = "catalog.user.registered"

func StartUserConsumer(ctx context.Context, rmqURL string, repo Repository) (*rabbitmq.Consumer, error) {
	c, err := rabbitmq.NewConsumer(rmqURL)
	if err != nil {
		return nil, fmt.Errorf("rabbitmq.NewConsumer: %w", err)
	}
	if err := c.DeclareTopicExchange(RabbitUserExchangeName); err != nil {
		c.Close()
		return nil, fmt.Errorf("rabbitmq exchange: %w", err)
	}
	if _, err := c.DeclareQueue(RabbitUserCatalogQueueName); err != nil {
		c.Close()
		return nil, fmt.Errorf("rabbitmq queue: %w", err)
	}
	if err := c.BindQueue(RabbitUserCatalogQueueName, RabbitUserExchangeName, RabbitUserRoutingKey); err != nil {
		c.Close()
		return nil, fmt.Errorf("rabbitmq bind: %w", err)
	}
	go func() {
		_ = c.Consume(ctx, RabbitUserCatalogQueueName, func(cctx context.Context, body []byte) error {
			var ev domain.User
			if err := json.Unmarshal(body, &ev); err != nil {
				return err
			}
			return repo.UpsertUser(cctx, ev.ID, ev.FullName, time.Now().UTC())
		})
	}()
	return c, nil
}
