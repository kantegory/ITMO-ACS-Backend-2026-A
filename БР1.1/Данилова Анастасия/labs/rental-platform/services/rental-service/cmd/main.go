package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"rental-platform/services/rental-service/internal/clients"
	"rental-platform/services/rental-service/internal/config"
	"rental-platform/services/rental-service/internal/consumer"
	"rental-platform/services/rental-service/internal/database"
	"rental-platform/services/rental-service/internal/handlers"
	"rental-platform/services/rental-service/internal/repository"
	"rental-platform/services/rental-service/internal/routes"
	"rental-platform/services/rental-service/internal/services"
	"rental-platform/shared/dto/events"
	"rental-platform/shared/rabbitmq"

	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	cfg := config.Load()
	if cfg.DBURL == "" {
		log.Fatal("DB_URL is required")
	}

	db := database.Connect(cfg.DBURL)

	var publisher *rabbitmq.Publisher
	var amqpConn *amqp.Connection
	if cfg.RabbitMQURL != "" {
		conn, err := rabbitmq.Connect(cfg.RabbitMQURL)
		if err != nil {
			log.Printf("rabbitmq connect failed: %v", err)
		} else {
			amqpConn = conn
			ch, err := rabbitmq.Channel(conn)
			if err != nil {
				log.Printf("rabbitmq channel failed: %v", err)
			} else if err := rabbitmq.DeclareTopology(ch); err != nil {
				log.Printf("rabbitmq topology failed: %v", err)
			} else {
				publisher = rabbitmq.NewPublisher(ch)
			}
		}
	}

	rentalRepo := &repository.RentalRepository{DB: db}
	rentalService := &services.RentalService{
		Rentals:   rentalRepo,
		Property:  clients.NewPropertyClient(cfg.PropertyServiceURL),
		Auth:      clients.NewAuthClient(cfg.AuthServiceURL),
		Publisher: publisher,
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	if amqpConn != nil {
		startUserDeletedConsumer(ctx, amqpConn, rentalService)
	}

	h := &handlers.RentalHandler{Service: rentalService}
	r := gin.Default()
	routes.Setup(r, h, cfg.JWTSecret)

	go func() {
		<-ctx.Done()
	}()

	log.Printf("rental-service listening on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}

func startUserDeletedConsumer(ctx context.Context, conn *amqp.Connection, rentalService *services.RentalService) {
	ch, err := rabbitmq.Channel(conn)
	if err != nil {
		log.Printf("rabbitmq consumer channel failed: %v", err)
		return
	}
	if err := rabbitmq.DeclareQueue(ch, consumer.QueueName, events.UserDeleted); err != nil {
		log.Printf("rabbitmq consumer queue failed: %v", err)
		return
	}

	c := &consumer.UserDeletedConsumer{Service: rentalService}
	if err := rabbitmq.Consume(ctx, ch, consumer.QueueName, c.Handle); err != nil {
		log.Printf("rabbitmq consume failed: %v", err)
		return
	}
	log.Printf("listening for %s on queue %s", events.UserDeleted, consumer.QueueName)
}
