package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"rental-platform/services/property-service/internal/clients"
	"rental-platform/services/property-service/internal/config"
	"rental-platform/services/property-service/internal/consumers"
	"rental-platform/services/property-service/internal/database"
	"rental-platform/services/property-service/internal/handlers"
	"rental-platform/services/property-service/internal/publishers"
	"rental-platform/services/property-service/internal/repository"
	"rental-platform/services/property-service/internal/routes"
	"rental-platform/services/property-service/internal/services"
	"rental-platform/shared/dto/events"
	"rental-platform/shared/rabbitmq"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	amqp "github.com/rabbitmq/amqp091-go"
)

const (
	queueUserDeleted  = "property.user-deleted"
	queueRentalEvents = "property.rental-events"
)

func main() {
	_ = godotenv.Load()

	cfg := config.Load()
	if cfg.DBURL == "" {
		log.Fatal("DB_URL is required")
	}

	db := database.Connect(cfg.DBURL)

	var publisher *rabbitmq.Publisher
	var consumerCh *amqp.Channel
	if cfg.RabbitMQURL != "" {
		conn, err := rabbitmq.ConnectWithRetry(cfg.RabbitMQURL, 30, 2*time.Second)
		if err != nil {
			log.Printf("rabbitmq connect failed: %v", err)
		} else {
			ch, err := rabbitmq.Channel(conn)
			if err != nil {
				log.Printf("rabbitmq channel failed: %v", err)
			} else if err := rabbitmq.DeclareTopology(ch); err != nil {
				log.Printf("rabbitmq topology failed: %v", err)
			} else {
				publisher = rabbitmq.NewPublisher(ch)

				consumerCh, err = rabbitmq.Channel(conn)
				if err != nil {
					log.Printf("rabbitmq consumer channel failed: %v", err)
				}
			}
		}
	}

	propertyService := &services.PropertyService{
		Properties: &repository.PropertyRepository{DB: db},
		Amenities:  &repository.AmenityRepository{DB: db},
		Images:     &repository.ImageRepository{DB: db},
		Publisher:  publishers.NewPropertyPublisher(publisher),
		Auth:       clients.NewAuthClient(cfg.AuthServiceURL),
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	if consumerCh != nil {
		startConsumers(ctx, consumerCh, propertyService)
	}

	propertyHandler := &handlers.PropertyHandler{Service: propertyService}
	amenityHandler := &handlers.AmenityHandler{Service: propertyService}
	imageHandler := &handlers.ImageHandler{Service: propertyService}

	r := gin.Default()
	routes.Setup(r, propertyHandler, amenityHandler, imageHandler, cfg.JWTSecret)

	log.Printf("property-service listening on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}

func startConsumers(ctx context.Context, ch *amqp.Channel, svc *services.PropertyService) {
	if err := rabbitmq.DeclareQueue(ch, queueUserDeleted, events.UserDeleted); err != nil {
		log.Printf("declare queue %s failed: %v", queueUserDeleted, err)
		return
	}
	if err := rabbitmq.DeclareQueue(ch, queueRentalEvents, events.RentalCreated, events.RentalCompleted); err != nil {
		log.Printf("declare queue %s failed: %v", queueRentalEvents, err)
		return
	}

	userDeleted := &consumers.UserDeletedConsumer{Service: svc}
	if err := rabbitmq.Consume(ctx, ch, queueUserDeleted, userDeleted.Handle); err != nil {
		log.Printf("consume %s failed: %v", queueUserDeleted, err)
	}

	rentalEvents := &consumers.RentalEventsConsumer{Service: svc}
	if err := rabbitmq.Consume(ctx, ch, queueRentalEvents, rentalEvents.Handle); err != nil {
		log.Printf("consume %s failed: %v", queueRentalEvents, err)
	}

	log.Printf("rabbitmq consumers started: %s, %s", queueUserDeleted, queueRentalEvents)
}
