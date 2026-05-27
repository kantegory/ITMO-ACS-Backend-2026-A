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

	AuthServiceURL    string
	PropertyServiceURL string
	PaymentServiceURL string

	ServiceToken string

	KafkaBrokers string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	c := &Config{
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnvAsInt("DB_PORT", 5432),
		DBUser:     getEnv("DB_USER", "booking"),
		DBPassword: getEnv("DB_PASSWORD", "bookingpass"),
		DBName:     getEnv("DB_NAME", "booking_db"),
		DBSSLMode:  getEnv("DB_SSLMODE", "disable"),

		ServerPort: getEnvAsInt("SERVER_PORT", 8083),
		ServerHost: getEnv("SERVER_HOST", "0.0.0.0"),

		AuthServiceURL:    getEnv("AUTH_SERVICE_URL", "http://localhost:8081"),
		PropertyServiceURL: getEnv("PROPERTY_SERVICE_URL", "http://localhost:8082"),
		PaymentServiceURL:  getEnv("PAYMENT_SERVICE_URL", "http://localhost:8084"),

		ServiceToken: getEnv("SERVICE_TOKEN", "internal-service-token"),

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