package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"

	"restaurant-booking/auth-service/internal/adapter/postgres"
)

type Config struct {
	Postgres   postgres.Config
	HTTPAddr   string
	JWTSecret  string
	JWTExpires string
	RabbitMQURL string
}

func LoadConfig() (Config, error) {
	if err := godotenv.Load(); err != nil {
		log.Println(".env not found")
	}

	return Config{
		Postgres: postgres.Config{
			DBDSN: getEnv("AUTH_DB_DSN", ""),
		},
		HTTPAddr:   getEnv("AUTH_HTTP_ADDR", ":8081"),
		JWTSecret:  getEnv("JWT_SECRET", "dev-secret-change-me"),
		JWTExpires: getEnv("JWT_EXPIRES", "24h"),
		RabbitMQURL: getEnv("RABBITMQ_URL", ""),
	}, nil
}

func getEnv(key, defaultVal string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultVal
}
