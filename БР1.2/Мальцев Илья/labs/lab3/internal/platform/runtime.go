package platform

import (
	"log"
	"net/http"
	"os"
	"time"
)

func Env(name string, defaultValue string) string {
	value := os.Getenv(name)
	if value == "" {
		return defaultValue
	}
	return value
}

func Listen(serviceName string, defaultPort string, handler http.Handler) error {
	port := Env("PORT", defaultPort)
	log.Printf("%s is listening on http://0.0.0.0:%s", serviceName, port)
	return http.ListenAndServe(":"+port, handler)
}

func ConfigureMessageBus() (EventPublisher, EventConsumer, func()) {
	rabbitURL := Env("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")
	bus, err := ConnectRabbitMQWithRetry(rabbitURL, 10, time.Second)
	if err != nil {
		log.Printf("rabbitmq is not available, message events are disabled: %v", err)
		return NoopPublisher{}, NoopConsumer{}, func() {}
	}

	log.Printf("rabbitmq connected: exchange=%s", EventsExchange)
	return bus, bus, func() {
		if err := bus.Close(); err != nil {
			log.Printf("rabbitmq close error: %v", err)
		}
	}
}

func ConnectRabbitMQWithRetry(url string, attempts int, delay time.Duration) (*RabbitMQ, error) {
	var lastErr error
	for attempt := 1; attempt <= attempts; attempt++ {
		bus, err := NewRabbitMQ(url)
		if err == nil {
			return bus, nil
		}

		lastErr = err
		log.Printf("rabbitmq connection attempt %d/%d failed: %v", attempt, attempts, err)
		time.Sleep(delay)
	}

	return nil, lastErr
}
