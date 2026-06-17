package config

import (
	"log"
	"os"
	"restaurant-booking/internal/adapter/postgres"

	"github.com/joho/godotenv"
)

type Config struct {
	Postgres   postgres.Config
	RedisURL   string
	HTTPAddr   string
	JWTSecret  string
	JWTExpires string
}

func LoadConfig() (Config, error) {
	if err := godotenv.Load(); err != nil {
		log.Println(".env not found")
	}

	config := Config{
		Postgres: postgres.Config{
			DBDSN: getEnv("DB_DSN", ""),
		},
		RedisURL:   getEnv("REDIS_URL", ""),
		HTTPAddr:   getEnv("HTTP_ADDR", ":8080"),
		JWTSecret:  getEnv("JWT_SECRET", "dev-secret-change-me"),
		JWTExpires: getEnv("JWT_EXPIRES", "24h"),
	}

	return config, nil
}

func getEnv(key, defaultVal string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultVal
}
