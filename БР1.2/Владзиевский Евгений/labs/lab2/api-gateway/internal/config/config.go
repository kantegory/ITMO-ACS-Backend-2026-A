package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	ServerPort        int
	ServerHost        string

	JWTSecret         string
	ServiceToken      string

	AuthServiceURL    string
	PropertyServiceURL string
	BookingServiceURL string
	PaymentServiceURL string
	MessagingServiceURL string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	c := &Config{
		ServerPort:         getEnvAsInt("SERVER_PORT", 8080),
		ServerHost:         getEnv("SERVER_HOST", "0.0.0.0"),

		JWTSecret:          getEnv("JWT_SECRET", "rental-microservices-secret-key"),
		ServiceToken:       getEnv("SERVICE_TOKEN", "internal-service-token"),

		AuthServiceURL:     getEnv("AUTH_SERVICE_URL", "http://localhost:8081"),
		PropertyServiceURL: getEnv("PROPERTY_SERVICE_URL", "http://localhost:8082"),
		BookingServiceURL:  getEnv("BOOKING_SERVICE_URL", "http://localhost:8083"),
		PaymentServiceURL:  getEnv("PAYMENT_SERVICE_URL", "http://localhost:8084"),
		MessagingServiceURL: getEnv("MESSAGING_SERVICE_URL", "http://localhost:8085"),
	}

	return c, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	str := getEnv(key, "")
	if str == "" {
		return defaultValue
	}
	val, err := strconv.Atoi(str)
	if err != nil {
		return defaultValue
	}
	return val
}

func (c *Config) Addr() string {
	return fmt.Sprintf("%s:%d", c.ServerHost, c.ServerPort)
}