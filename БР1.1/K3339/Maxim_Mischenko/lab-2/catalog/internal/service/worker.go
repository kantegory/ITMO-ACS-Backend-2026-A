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
	q, _ := ch.QueueDeclare("rating_updates", true, false, false, false, nil)

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
