package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"rental-platform/services/auth-service/internal/config"
	"rental-platform/services/auth-service/internal/database"
	"rental-platform/services/auth-service/internal/handlers"
	"rental-platform/services/auth-service/internal/repository"
	"rental-platform/services/auth-service/internal/routes"
	"rental-platform/services/auth-service/internal/services"
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

	db := database.Connect(cfg.DBURL)

	var publisher *rabbitmq.Publisher
	if cfg.RabbitMQURL != "" {
		conn, err := rabbitmq.Connect(cfg.RabbitMQURL)
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

	authService := &services.AuthService{
		Users:     &repository.UserRepository{DB: db},
		Tokens:    &repository.RefreshTokenRepository{DB: db},
		JWTSecret: cfg.JWTSecret,
		Publisher: publisher,
	}

	h := &handlers.AuthHandler{Service: authService}
	r := gin.Default()
	routes.Setup(r, h, cfg.JWTSecret)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	go func() {
		<-ctx.Done()
	}()

	log.Printf("auth-service listening on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}
