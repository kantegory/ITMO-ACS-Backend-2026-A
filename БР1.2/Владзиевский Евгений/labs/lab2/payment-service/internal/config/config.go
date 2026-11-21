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

	BookingServiceURL string
	ServiceToken       string
	JWTSecret          string

	KafkaBrokers string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	c := &Config{
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnvAsInt("DB_PORT", 5432),
		DBUser:     getEnv("DB_USER", "payment"),
		DBPassword: getEnv("DB_PASSWORD", "paymentpass"),
		DBName:     getEnv("DB_NAME", "payment_db"),
		DBSSLMode:  getEnv("DB_SSLMODE", "disable"),

		ServerPort: getEnvAsInt("SERVER_PORT", 8084),
		ServerHost: getEnv("SERVER_HOST", "0.0.0.0"),

		BookingServiceURL: getEnv("BOOKING_SERVICE_URL", "http://booking-service:8083"),
		ServiceToken:      getEnv("SERVICE_TOKEN", "internal-service-token"),
		JWTSecret:         getEnv("JWT_SECRET", "rental-microservices-secret-key"),

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