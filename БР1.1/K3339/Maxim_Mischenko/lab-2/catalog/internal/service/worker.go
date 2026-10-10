package service

import (
	"catalog/internal/repository"
	"encoding/json"
	"log"

	"github.com/streadway/amqp"
)

func StartRatingWorker(repo *repository.CatalogRepository) {
	conn, err := amqp.Dial("amqp://guest:guest@rabbitmq:5672/")
	if err != nil {
		log.Fatalf("Worker: Failed to connect to RabbitMQ: %v", err)
	}

	ch, _ := conn.Channel()

	ch.ExchangeDeclare("rating_exchange", "direct", true, false, false, false, nil)

	q, _ := ch.QueueDeclare("rating_updates_main", true, false, false, false, nil)

	ch.QueueBind(q.Name, "rating_key", "rating_exchange", false, nil)

	msgs, _ := ch.Consume(q.Name, "", true, false, false, false, nil)

	go func() {
		for d := range msgs {
			var data struct {
				ID int `json:"restaurant_id"`
				Avg float64 `json:"avg_rating"`
				Count int `json:"reviews_count"`
			}
			json.Unmarshal(d.Body, &data)

			log.Printf("Worker: Updating restaurant %d with rating %f", data.ID, data.Avg)
			repo.UpdateRestaurantRating(data.ID, data.Avg, data.Count)
		}
	}()
}
