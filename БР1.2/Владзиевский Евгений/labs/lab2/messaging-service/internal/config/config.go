package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	DBHost     string
	DBPort     int
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string

	ServerPort int
	ServerHost string

	JWTSecret    string
	ServiceToken string

	AuthServiceURL      string
	BookingServiceURL   string
	PropertyServiceURL  string

	KafkaBrokers string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	c := &Config{
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnvAsInt("DB_PORT", 5436),
		DBUser:     getEnv("DB_USER", "messaging"),
		DBPassword: getEnv("DB_PASSWORD", "messagingpass"),
		DBName:     getEnv("DB_NAME", "messaging_db"),
		DBSSLMode:  getEnv("DB_SSLMODE", "disable"),

		ServerPort: getEnvAsInt("SERVER_PORT", 8085),
		ServerHost: getEnv("SERVER_HOST", "0.0.0.0"),

		JWTSecret:    getEnv("JWT_SECRET", "rental-microservices-secret-key"),
		ServiceToken: getEnv("SERVICE_TOKEN", "internal-service-token"),

		AuthServiceURL:      getEnv("AUTH_SERVICE_URL", "http://localhost:8081"),
		BookingServiceURL:   getEnv("BOOKING_SERVICE_URL", "http://localhost:8083"),
		PropertyServiceURL:  getEnv("PROPERTY_SERVICE_URL", "http://localhost:8082"),

		KafkaBrokers: getEnv("KAFKA_BROKERS", "localhost:9092"),
	}

	return c, nil
}

func (c *Config) DSN() string {
	return fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		c.DBHost, c.DBPort, c.DBUser, c.DBPassword, c.DBName, c.DBSSLMode)
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