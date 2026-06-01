package main

import (
	"context"
	"encoding/json"
	"log/slog"
	"os"
	"os/signal"
	"strings"
	"syscall"

	"github.com/segmentio/kafka-go"
)

func main() {
	log := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))

	brokers := env("KAFKA_BROKERS", "kafka:9092")
	topic := env("KAFKA_TOPIC", "bookings")
	groupID := env("KAFKA_GROUP_ID", "notification-service")

	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:     strings.Split(brokers, ","),
		Topic:       topic,
		GroupID:     groupID,
		StartOffset: kafka.FirstOffset,
	})
	defer reader.Close()

	log.Info("notification-service started", "brokers", brokers, "topic", topic, "group", groupID)

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	for {
		msg, err := reader.ReadMessage(ctx)
		if err != nil {
			if ctx.Err() != nil {
				log.Info("shutting down")
				return
			}
			log.Error("read message failed", "error", err)
			continue
		}

		var evt map[string]any
		if err := json.Unmarshal(msg.Value, &evt); err != nil {
			log.Error("invalid event json", "error", err, "raw", string(msg.Value))
			continue
		}

		log.Info("NOTIFICATION",
			"event", evt["event"],
			"booking_id", evt["booking_id"],
			"user_id", evt["user_id"],
			"table_id", evt["table_id"],
			"booked_date", evt["booked_date"],
			"partition", msg.Partition,
			"offset", msg.Offset,
		)
	}
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
