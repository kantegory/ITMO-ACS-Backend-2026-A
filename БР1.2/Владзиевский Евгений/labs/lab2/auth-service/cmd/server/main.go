package main

import (
	"auth-service/internal/config"
	"auth-service/internal/database"
	ekafka "auth-service/internal/kafka"
	"auth-service/internal/middleware"
	"auth-service/internal/repositories"
	"auth-service/internal/routes"
	"context"
	"log"
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

	brokers := strings.Split(cfg.KafkaBrokers, ",")
	userProducer := ekafka.NewProducer(brokers, ekafka.TopicUserEvents)

	outboxRepo := repositories.NewOutboxRepository()
	outboxProc := ekafka.NewOutboxProcessor(outboxRepo, map[string]*ekafka.Producer{
		ekafka.TopicUserEvents: userProducer,
	})

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go outboxProc.Start(ctx)

	gin.SetMode(gin.ReleaseMode)

	router := gin.New()
	router.Use(middleware.LoggingMiddleware())
	router.Use(gin.Recovery())

	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "auth"})
	})

	routes.SetupRoutes(router, cfg, outboxRepo)

	addr := cfg.ServerHost + ":" + strconv.Itoa(cfg.ServerPort)
	log.Printf("Auth Service starting on %s", addr)

	go func() {
		if err := router.Run(addr); err != nil {
			log.Fatal("Server failed to start:", err)
		}
	}()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	<-sigCh
	log.Println("Shutting down auth service...")
	cancel()
	userProducer.Close()
}
