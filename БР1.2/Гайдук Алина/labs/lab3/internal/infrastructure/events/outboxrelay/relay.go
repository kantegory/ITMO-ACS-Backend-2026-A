package outboxrelay

import (
	"context"
	"log/slog"
	"time"

	eventsdomain "recipehub/internal/domain/events"
)

type Store interface {
	PendingOutboxEvents(ctx context.Context, limit int) ([]eventsdomain.Envelope, error)
	MarkOutboxPublished(ctx context.Context, eventID string) error
	MarkOutboxFailed(ctx context.Context, eventID string, publishErr error) error
}

type Publisher interface {
	Publish(ctx context.Context, event eventsdomain.Envelope) error
}

const publishTimeout = 10 * time.Second

func Start(ctx context.Context, store Store, publisher Publisher, interval time.Duration, batchSize int) {
	if interval <= 0 {
		interval = time.Second
	}
	if batchSize < 1 {
		batchSize = 10
	}

	go func() {
		ticker := time.NewTicker(interval)
		defer ticker.Stop()

		for {
			relayOnce(ctx, store, publisher, batchSize)

			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
			}
		}
	}()
}

func relayOnce(ctx context.Context, store Store, publisher Publisher, batchSize int) {
	events, err := store.PendingOutboxEvents(ctx, batchSize)
	if err != nil {
		slog.Error("load outbox events", "error", err)
		return
	}

	for _, event := range events {
		if ctx.Err() != nil {
			return
		}

		publishCtx, cancel := context.WithTimeout(ctx, publishTimeout)
		err := publisher.Publish(publishCtx, event)
		cancel()
		if err != nil {
			slog.Error("publish outbox event", "event_id", event.EventID, "event_type", event.EventType, "error", err)
			if markErr := store.MarkOutboxFailed(ctx, event.EventID, err); markErr != nil {
				slog.Error("mark outbox event failed", "event_id", event.EventID, "error", markErr)
			}
			continue
		}

		if err := store.MarkOutboxPublished(ctx, event.EventID); err != nil {
			slog.Error("mark outbox event published", "event_id", event.EventID, "error", err)
		}
	}
}
