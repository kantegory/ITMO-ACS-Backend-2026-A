package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"

	"restaurant-booking/booking-service/internal/adapter/postgres"
)

type Config struct {
	Postgres          postgres.Config
	HTTPAddr          string
	JWTSecret         string
	CatalogServiceURL string
	RabbitMQURL       string
}

func LoadConfig() (Config, error) {
	if err := godotenv.Load(); err != nil {
		log.Println(".env not found")
	}

	return Config{
		Postgres: postgres.Config{
			DBDSN: getEnv("BOOKING_DB_DSN", ""),
		},
		HTTPAddr:          getEnv("BOOKING_HTTP_ADDR", ":8083"),
		JWTSecret:         getEnv("JWT_SECRET", "dev-secret-change-me"),
		CatalogServiceURL: getEnv("CATALOG_SERVICE_URL", "http://catalog-service:8082"),
		RabbitMQURL:       getEnv("RABBITMQ_URL", ""),
	}, nil
}

func getEnv(key, defaultVal string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultVal
}
