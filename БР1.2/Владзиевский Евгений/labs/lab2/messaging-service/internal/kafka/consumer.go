package kafka

import (
	"context"
	"encoding/json"
	"log"
	"time"

	kc "github.com/segmentio/kafka-go"
)

type EventEnvelope struct {
	EventID       string          `json:"event_id"`
	EventType     string          `json:"event_type"`
	AggregateType string          `json:"aggregate_type"`
	AggregateID   uint            `json:"aggregate_id"`
	Timestamp     string          `json:"timestamp"`
	Data          json.RawMessage `json:"data"`
	Source        string          `json:"source"`
}

type EventHandler func(event EventEnvelope)

type Consumer struct {
	reader   *kc.Reader
	handlers map[string]EventHandler
}

func NewConsumer(brokers []string, groupID string, topics []string) *Consumer {
	reader := kc.NewReader(kc.ReaderConfig{
		Brokers:        brokers,
		GroupID:        groupID,
		GroupTopics:    topics,
		MinBytes:       10e3,
		MaxBytes:       10e6,
		StartOffset:    kc.LastOffset,
		CommitInterval: time.Second,
	})

	log.Printf("Kafka consumer group '%s' initialized for topics: %v", groupID, topics)
	return &Consumer{
		reader:   reader,
		handlers: make(map[string]EventHandler),
	}
}

func (c *Consumer) RegisterHandler(eventType string, handler EventHandler) {
	c.handlers[eventType] = handler
}

func (c *Consumer) Start(ctx context.Context) {
	go func() {
		for {
			select {
			case <-ctx.Done():
				log.Println("Messaging consumer stopped")
				return
			default:
				msg, err := c.reader.FetchMessage(ctx)
				if err != nil {
					if ctx.Err() != nil {
						return
					}
					log.Printf("Error fetching message: %v", err)
					time.Sleep(time.Second)
					continue
				}

				var envelope EventEnvelope
				if err := json.Unmarshal(msg.Value, &envelope); err != nil {
					log.Printf("Failed to unmarshal event: %v", err)
					_ = c.reader.CommitMessages(ctx, msg)
					continue
				}

				handler, ok := c.handlers[envelope.EventType]
				if !ok {
					log.Printf("No handler for event type: %s", envelope.EventType)
					_ = c.reader.CommitMessages(ctx, msg)
					continue
				}

				handler(envelope)

				if err := c.reader.CommitMessages(ctx, msg); err != nil {
					log.Printf("Failed to commit message: %v", err)
				}
			}
		}
	}()
}

func (c *Consumer) Close() error {
	return c.reader.Close()
}
