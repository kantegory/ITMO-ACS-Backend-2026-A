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
		Topic:                  "job-events",
		AllowAutoTopicCreation: true,
	}
	log.Printf("Kafka продюсер инициализирован для брокера %s", broker)
}

func Close() {
	if writer != nil {
		writer.Close()
	}
}

func PublishApplicationSubmitted(jobID, resumeID, employerID string) {
	if writer == nil {
		log.Println("Kafka writer is not initialized")
		return
	}

	payload := map[string]interface{}{
		"event_type":  "ApplicationSubmitted",
		"job_id":      jobID,
		"resume_id":   resumeID,
		"employer_id": employerID,
		"timestamp":   time.Now(),
	}

	bytes, _ := json.Marshal(payload)
	err := writer.WriteMessages(context.Background(),
		kafka.Message{
			Key:   []byte(jobID),
			Value: bytes,
		},
	)

	if err != nil {
		log.Printf("Не удалось опубликовать событие ApplicationSubmitted: %v", err)
	} else {
		log.Printf("Опубликовано событие ApplicationSubmitted для вакансии %s", jobID)
	}
}

func PublishApplicationStatusChanged(appID, status, jobSeekerID string) {
	if writer == nil {
		log.Println("Kafka writer is not initialized")
		return
	}

	payload := map[string]interface{}{
		"event_type":     "ApplicationStatusChanged",
		"application_id": appID,
		"status":         status,
		"job_seeker_id":  jobSeekerID,
		"timestamp":      time.Now(),
	}

	bytes, _ := json.Marshal(payload)
	err := writer.WriteMessages(context.Background(),
		kafka.Message{
			Key:   []byte(appID),
			Value: bytes,
		},
	)

	if err != nil {
		log.Printf("Не удалось опубликовать событие ApplicationStatusChanged: %v", err)
	} else {
		log.Printf("Опубликовано событие ApplicationStatusChanged для отклика %s", appID)
	}
}
