package kafka

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	kc "github.com/segmentio/kafka-go"
)

type Producer struct {
	writer *kc.Writer
	topic  string
}

func NewProducer(brokers []string, topic string) *Producer {
	writer := &kc.Writer{
		Addr:         kc.TCP(brokers...),
		Topic:        topic,
		Balancer:     &kc.Hash{},
		BatchSize:    1,
		BatchTimeout: 10 * time.Millisecond,
		RequiredAcks: kc.RequireOne,
	}

	log.Printf("Kafka producer initialized for topic: %s", topic)
	return &Producer{writer: writer, topic: topic}
}

func (p *Producer) Publish(key string, value interface{}) error {
	data, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err = p.writer.WriteMessages(ctx, kc.Message{
		Key:   []byte(key),
		Value: data,
	})
	if err != nil {
		return fmt.Errorf("failed to publish message: %w", err)
	}

	return nil
}

func (p *Producer) Close() error {
	return p.writer.Close()
}
