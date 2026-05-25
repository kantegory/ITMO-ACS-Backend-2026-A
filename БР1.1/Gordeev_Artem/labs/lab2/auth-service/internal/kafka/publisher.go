package kafka

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"time"

	"github.com/segmentio/kafka-go"
)

var writer *kafka.Writer

func InitKafka() {
	broker := os.Getenv("KAFKA_BROKER")
	if broker == "" {
		broker = "kafka:9092"
	}

	writer = &kafka.Writer{
		Addr:                   kafka.TCP(broker),
		Topic:                  "user-events",
		AllowAutoTopicCreation: true,
	}
	log.Printf("Kafka продюсер инициализирован для брокера %s", broker)
}

func Close() {
	if writer != nil {
		writer.Close()
	}
}

func PublishUserRegistered(userID, email, role string) {
	if writer == nil {
		log.Println("Kafka writer не инициализирован")
		return
	}

	payload := map[string]interface{}{
		"event_type": "UserRegistered",
		"user_id":    userID,
		"email":      email,
		"role":       role,
		"timestamp":  time.Now(),
	}

	bytes, _ := json.Marshal(payload)
	err := writer.WriteMessages(context.Background(),
		kafka.Message{
			Key:   []byte(userID),
			Value: bytes,
		},
	)

	if err != nil {
		log.Printf("Не удалось опубликовать событие UserRegistered: %v", err)
	} else {
		log.Printf("Опубликовано событие UserRegistered для %s", email)
	}
}
