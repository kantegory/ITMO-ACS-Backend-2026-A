package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"property-service/internal/client"
	"property-service/internal/config"
	"property-service/internal/database"
	ekafka "property-service/internal/kafka"
	"property-service/internal/middleware"
	"property-service/internal/repositories"
	"property-service/internal/routes"
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
	database.SeedData()

	if err := ensureStorageDir(cfg.UploadDir); err != nil {
		log.Fatal("Failed to create storage directory:", err)
	}

	authClient := client.NewAuthClient(cfg)
	brokers := strings.Split(cfg.KafkaBrokers, ",")

	propertyProducer := ekafka.NewProducer(brokers, ekafka.TopicPropertyEvents)
	outboxRepo := repositories.NewOutboxRepository()
	outboxProc := ekafka.NewOutboxProcessor(outboxRepo, map[string]*ekafka.Producer{
		ekafka.TopicPropertyEvents: propertyProducer,
	})

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go outboxProc.Start(ctx)

	if cfg.LogLevel == "debug" {
		gin.SetMode(gin.DebugMode)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()
	router.Use(middleware.LoggingMiddleware())
	router.Use(gin.Recovery())

	router.Static("/uploads", cfg.UploadDir)

	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "property"})
	})

	routes.SetupRoutes(router, cfg, authClient, outboxRepo)

	addr := cfg.ServerHost + ":" + strconv.Itoa(cfg.ServerPort)
	log.Printf("Property Service starting on %s", addr)

	go func() {
		if err := router.Run(addr); err != nil {
			log.Fatal("Server failed to start:", err)
		}
	}()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	<-sigCh
	log.Println("Shutting down property service...")
	cancel()
	propertyProducer.Close()
}

func ensureStorageDir(path string) error {
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return os.MkdirAll(path, 0755)
	}
	return nil
}
