package register

import (
	"context"

	"restaurant-booking/auth-service/internal/adapter/rabbitmq"
)

type rabbitPublisher struct {
	publisher  *rabbitmq.Publisher
	exchange   string
	routingKey string
}

func NewPublisher(publisher *rabbitmq.Publisher, exchange string, routingKey string) *rabbitPublisher {
	return &rabbitPublisher{publisher: publisher, exchange: exchange, routingKey: routingKey}
}

func (p *rabbitPublisher) PublishUser(ctx context.Context, payload User) error {
	if err := p.publisher.DeclareTopicExchange(p.exchange); err != nil {
		return err
	}
	return p.publisher.PublishJSON(ctx, p.exchange, p.routingKey, payload)
}
