package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/segmentio/kafka-go"
)

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

func main() {
	broker := getEnv("KAFKA_BROKER", "kafka:9092")
	topics := []string{"user-events", "job-events"}

	log.Printf("Сервис уведомлений запускается... Брокер: %s", broker)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-sigs
		log.Println("Завершение работы...")
		cancel()
	}()

	for _, topic := range topics {
		go consumeTopic(ctx, broker, topic)
	}

	<-ctx.Done()
}

func consumeTopic(ctx context.Context, broker, topic string) {
	r := kafka.NewReader(kafka.ReaderConfig{
		Brokers: []string{broker},
		Topic:   topic,
		GroupID: "notification-service-group",
	})

	defer r.Close()

	log.Printf("Начато прослушивание топика: %s", topic)

	for {
		m, err := r.ReadMessage(ctx)
		if err != nil {
			if ctx.Err() != nil {
				return
			}
			log.Printf("Ошибка чтения сообщения из топика %s: %v", topic, err)
			continue
		}

		handleMessage(m)
	}
}

func handleMessage(m kafka.Message) {
	var payload map[string]interface{}
	if err := json.Unmarshal(m.Value, &payload); err != nil {
		log.Printf("Не удалось распарсить сообщение из топика %s: %v", m.Topic, err)
		return
	}

	eventType, _ := payload["event_type"].(string)

	switch eventType {
	case "UserRegistered":
		email, _ := payload["email"].(string)
		role, _ := payload["role"].(string)
		fmt.Printf("[NOTIFICATION] Отправка приветственного письма для %s (Роль: %s)\n", email, role)

	case "ApplicationSubmitted":
		jobID, _ := payload["job_id"].(string)
		resumeID, _ := payload["resume_id"].(string)
		employerID, _ := payload["employer_id"].(string) // from job
		fmt.Printf("[NOTIFICATION] Работодатель %s: Новый отклик на вакансию %s с резюме %s\n", employerID, jobID, resumeID)

	case "ApplicationStatusChanged":
		appID, _ := payload["application_id"].(string)
		status, _ := payload["status"].(string)
		jobSeekerID, _ := payload["job_seeker_id"].(string)
		fmt.Printf("[NOTIFICATION] Соискатель %s: Статус вашего отклика %s изменен на %s\n", jobSeekerID, appID, status)

	default:
		log.Printf("Неизвестный тип события: %s", eventType)
	}
}
