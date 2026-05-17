package rabbitmq

import (
	"fmt"

	amqp "github.com/rabbitmq/amqp091-go"
)

func Connect(url string) (*amqp.Connection, error) {
	if url == "" {
		return nil, fmt.Errorf("rabbitmq url is empty")
	}
	return amqp.Dial(url)
}

func Channel(conn *amqp.Connection) (*amqp.Channel, error) {
	return conn.Channel()
}
