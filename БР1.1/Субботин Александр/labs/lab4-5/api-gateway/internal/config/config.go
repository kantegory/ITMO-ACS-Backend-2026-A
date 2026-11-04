package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	WebPort                string
	UserServiceURL         string
	PropertyServiceGRPCURL string
	BookingServiceGRPCURL  string
	ChatServiceURL         string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	cfg := &Config{
		WebPort:                getEnv("WEB_PORT", ":8080"),
		UserServiceURL:         getEnv("USER_SERVICE_URL", "http://localhost:8081"),
		PropertyServiceGRPCURL: getEnv("PROPERTY_SERVICE_GRPC_URL", "localhost:9082"),
		BookingServiceGRPCURL:  getEnv("BOOKING_SERVICE_GRPC_URL", "localhost:9083"),
		ChatServiceURL:         getEnv("CHAT_SERVICE_URL", "http://localhost:8084"),
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
