package publishers

import (
	"context"

	"rental-platform/shared/dto/events"
	"rental-platform/shared/rabbitmq"
)

type PropertyPublisher struct {
	pub *rabbitmq.Publisher
}

func NewPropertyPublisher(pub *rabbitmq.Publisher) *PropertyPublisher {
	return &PropertyPublisher{pub: pub}
}

func (p *PropertyPublisher) Created(ctx context.Context, propertyID, ownerID uint) error {
	if p == nil || p.pub == nil {
		return nil
	}
	return p.pub.Publish(ctx, events.PropertyCreated, events.PropertyPayload{
		PropertyID: propertyID,
		OwnerID:    ownerID,
	})
}

func (p *PropertyPublisher) Updated(ctx context.Context, propertyID, ownerID uint) error {
	if p == nil || p.pub == nil {
		return nil
	}
	return p.pub.Publish(ctx, events.PropertyUpdated, events.PropertyPayload{
		PropertyID: propertyID,
		OwnerID:    ownerID,
	})
}

func (p *PropertyPublisher) Deleted(ctx context.Context, propertyID, ownerID uint) error {
	if p == nil || p.pub == nil {
		return nil
	}
	return p.pub.Publish(ctx, events.PropertyDeleted, events.PropertyPayload{
		PropertyID: propertyID,
		OwnerID:    ownerID,
	})
}
