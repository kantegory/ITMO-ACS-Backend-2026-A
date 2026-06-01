package kafka

import (
	"context"
	"encoding/json"
	"log/slog"
	"os"
	"time"

	"github.com/segmentio/kafka-go"
)

// Notifier publishes booking domain events to Kafka. Noop when KAFKA_BROKERS is unset.
type Notifier interface {
	NotifyBookingCreated(ctx context.Context, payload BookingEvent) error
	NotifyBookingCancelled(ctx context.Context, payload BookingEvent) error
	Close() error
}

type BookingEvent struct {
	Event      string `json:"event"`
	BookingID  string `json:"booking_id"`
	UserID     string `json:"user_id,omitempty"`
	TableID    string `json:"table_id,omitempty"`
	BookedDate string `json:"booked_date,omitempty"`
}

type noopNotifier struct{}

func (noopNotifier) NotifyBookingCreated(context.Context, BookingEvent) error  { return nil }
func (noopNotifier) NotifyBookingCancelled(context.Context, BookingEvent) error { return nil }
func (noopNotifier) Close() error                                               { return nil }

type writerNotifier struct {
	writer *kafka.Writer
	log    *slog.Logger
}

func NewNotifierFromEnv(log *slog.Logger) Notifier {
	brokers := os.Getenv("KAFKA_BROKERS")
	if brokers == "" {
		log.Info("KAFKA_BROKERS not set, kafka events disabled")
		return noopNotifier{}
	}

	topic := os.Getenv("KAFKA_TOPIC")
	if topic == "" {
		topic = "bookings"
	}

	w := &kafka.Writer{
		Addr:         kafka.TCP(brokers),
		Topic:        topic,
		Balancer:     &kafka.LeastBytes{},
		RequiredAcks: kafka.RequireOne,
		Async:        false,
	}

	log.Info("kafka notifier ready", "brokers", brokers, "topic", topic)
	return &writerNotifier{writer: w, log: log}
}

func (n *writerNotifier) NotifyBookingCreated(ctx context.Context, p BookingEvent) error {
	p.Event = "booking.created"
	return n.publish(ctx, p)
}

func (n *writerNotifier) NotifyBookingCancelled(ctx context.Context, p BookingEvent) error {
	p.Event = "booking.cancelled"
	return n.publish(ctx, p)
}

func (n *writerNotifier) publish(ctx context.Context, p BookingEvent) error {
	body, err := json.Marshal(p)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	if err := n.writer.WriteMessages(ctx, kafka.Message{
		Key:   []byte(p.Event),
		Value: body,
	}); err != nil {
		return err
	}

	n.log.Info("kafka event published", "event", p.Event, "booking_id", p.BookingID)
	return nil
}

func (n *writerNotifier) Close() error {
	return n.writer.Close()
}
