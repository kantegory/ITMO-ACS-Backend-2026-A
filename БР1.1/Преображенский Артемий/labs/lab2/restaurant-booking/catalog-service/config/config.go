package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"

	"restaurant-booking/catalog-service/internal/adapter/postgres"
)

type Config struct {
	Postgres       postgres.Config
	HTTPAddr       string
	JWTSecret      string
	AuthServiceURL string
	RabbitMQURL    string
}

func LoadConfig() (Config, error) {
	if err := godotenv.Load(); err != nil {
		log.Println(".env not found")
	}

	return Config{
		Postgres: postgres.Config{
			DBDSN: getEnv("CATALOG_DB_DSN", ""),
		},
		HTTPAddr:       getEnv("CATALOG_HTTP_ADDR", ":8082"),
		JWTSecret:      getEnv("JWT_SECRET", "dev-secret-change-me"),
		AuthServiceURL: getEnv("AUTH_SERVICE_URL", "http://auth-service:8081"),
		RabbitMQURL:    getEnv("RABBITMQ_URL", ""),
	}, nil
}

func getEnv(key, defaultVal string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultVal
}
