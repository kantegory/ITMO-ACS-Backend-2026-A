package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"rental-platform/services/chat-service/internal/clients"
	"rental-platform/services/chat-service/internal/config"
	"rental-platform/services/chat-service/internal/database"
	chatEvents "rental-platform/services/chat-service/internal/events"
	"rental-platform/services/chat-service/internal/handlers"
	"rental-platform/services/chat-service/internal/repository"
	"rental-platform/services/chat-service/internal/routes"
	"rental-platform/services/chat-service/internal/services"
	"rental-platform/shared/rabbitmq"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	cfg := config.Load()
	if cfg.DBURL == "" {
		log.Fatal("DB_URL is required")
	}
	if cfg.PropertyServiceURL == "" {
		log.Fatal("PROPERTY_SERVICE_URL is required")
	}

	db := database.Connect(cfg.DBURL)

	var publisher *rabbitmq.Publisher
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
			}
		}
	}

	chatService := &services.ChatService{
		Chats:     &repository.ChatRepository{DB: db},
		Messages:  &repository.MessageRepository{DB: db},
		Property:  clients.NewPropertyClient(cfg.PropertyServiceURL),
		Auth:      clients.NewAuthClient(cfg.AuthServiceURL),
		Publisher: publisher,
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	if cfg.RabbitMQURL != "" {
		conn, err := rabbitmq.ConnectWithRetry(cfg.RabbitMQURL, 30, 2*time.Second)
		if err != nil {
			log.Printf("rabbitmq consumer connect failed: %v", err)
		} else {
			ch, err := rabbitmq.Channel(conn)
			if err != nil {
				log.Printf("rabbitmq consumer channel failed: %v", err)
			} else if err := rabbitmq.DeclareTopology(ch); err != nil {
				log.Printf("rabbitmq consumer topology failed: %v", err)
			} else if err := chatEvents.StartConsumer(ctx, ch, chatService); err != nil {
				log.Printf("rabbitmq consumer start failed: %v", err)
			}
		}
	}

	h := &handlers.ChatHandler{Service: chatService}
	r := gin.Default()
	routes.Setup(r, h, cfg.JWTSecret)

	log.Printf("chat-service listening on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}
