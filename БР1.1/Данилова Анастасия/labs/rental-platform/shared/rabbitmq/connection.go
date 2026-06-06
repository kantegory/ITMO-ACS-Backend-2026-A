package rabbitmq

import (
	"fmt"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

func Connect(url string) (*amqp.Connection, error) {
	return ConnectWithRetry(url, 1, 0)
}

// ConnectWithRetry waits for RabbitMQ to accept AMQP (broker may be "healthy" before port is open).
func ConnectWithRetry(url string, attempts int, delay time.Duration) (*amqp.Connection, error) {
	if url == "" {
		return nil, fmt.Errorf("rabbitmq url is empty")
	}
	if attempts < 1 {
		attempts = 1
	}

	var lastErr error
	for i := 0; i < attempts; i++ {
		conn, err := amqp.Dial(url)
		if err == nil {
			return conn, nil
		}
		lastErr = err
		if i+1 < attempts && delay > 0 {
			time.Sleep(delay)
		}
	}
	return nil, lastErr
}

func Channel(conn *amqp.Connection) (*amqp.Channel, error) {
	return conn.Channel()
}
