package main

import (
	"context"
	"log"
	"messaging-service/internal/config"
	"messaging-service/internal/database"
	ekafka "messaging-service/internal/kafka"
	"messaging-service/internal/middleware"
	"messaging-service/internal/routes"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("Failed to load config:", err)
	}

	if err := database.Connect(cfg); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	if err := database.AutoMigrate(); err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	if cfg.ServerPort != 8085 {
		log.Printf("WARNING: Messaging Service typically runs on port 8085, got %d", cfg.ServerPort)
	}

	brokers := strings.Split(cfg.KafkaBrokers, ",")
	msgConsumer := ekafka.NewConsumer(brokers, "messaging-group", []string{
		"rental.events",
		"user.events",
		"property.events",
	})

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	msgConsumer.RegisterHandler("rental.created", func(event ekafka.EventEnvelope) {
		log.Printf("Messaging consumer: rental.created event received, aggregate_id: %d", event.AggregateID)
	})
	msgConsumer.RegisterHandler("rental.status_changed", func(event ekafka.EventEnvelope) {
		log.Printf("Messaging consumer: rental.status_changed event received, aggregate_id: %d", event.AggregateID)
	})
	msgConsumer.RegisterHandler("user.registered", func(event ekafka.EventEnvelope) {
		log.Printf("Messaging consumer: user.registered event received, aggregate_id: %d", event.AggregateID)
	})
	msgConsumer.RegisterHandler("property.created", func(event ekafka.EventEnvelope) {
		log.Printf("Messaging consumer: property.created event received, aggregate_id: %d", event.AggregateID)
	})
	msgConsumer.RegisterHandler("property.archived", func(event ekafka.EventEnvelope) {
		log.Printf("Messaging consumer: property.archived event received, aggregate_id: %d", event.AggregateID)
	})

	msgConsumer.Start(ctx)

	gin.SetMode(gin.ReleaseMode)

	router := gin.New()
	router.Use(middleware.LoggingMiddleware())
	router.Use(gin.Recovery())

	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "messaging"})
	})

	routes.SetupRoutes(router, cfg)

	addr := cfg.ServerHost + ":" + strconv.Itoa(cfg.ServerPort)
	log.Printf("Messaging Service starting on %s", addr)

	go func() {
		if err := router.Run(addr); err != nil {
			log.Fatal("Server failed to start:", err)
		}
	}()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	<-sigCh
	log.Println("Shutting down messaging service...")
	cancel()
	msgConsumer.Close()
}
