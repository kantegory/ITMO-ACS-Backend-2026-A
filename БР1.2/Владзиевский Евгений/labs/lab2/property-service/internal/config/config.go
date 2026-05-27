package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"

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

	AuthServiceURL string
	ServiceToken    string
	JWTSecret       string

	UploadDir         string
	MaxUploadSize     int64
	AllowedImageTypes []string

	LogLevel  string
	LogFormat string

	KafkaBrokers string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	c := &Config{
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnvAsInt("DB_PORT", 5432),
		DBUser:     getEnv("DB_USER", "property"),
		DBPassword: getEnv("DB_PASSWORD", "propertypass"),
		DBName:     getEnv("DB_NAME", "property_catalog_db"),
		DBSSLMode:  getEnv("DB_SSLMODE", "disable"),

		ServerPort: getEnvAsInt("SERVER_PORT", 8082),
		ServerHost: getEnv("SERVER_HOST", "0.0.0.0"),

		AuthServiceURL: getEnv("AUTH_SERVICE_URL", "http://localhost:8081"),
		ServiceToken:   getEnv("SERVICE_TOKEN", "internal-service-token"),
		JWTSecret:      getEnv("JWT_SECRET", "rental-microservices-secret-key"),

		UploadDir:         getEnv("UPLOAD_DIR", "./storage"),
		MaxUploadSize:     getEnvAsInt64("MAX_UPLOAD_SIZE", 10*1024*1024),
		AllowedImageTypes: getEnvAsSlice("ALLOWED_IMAGE_TYPES", []string{"image/jpeg", "image/png", "image/gif"}, ","),

		LogLevel:  getEnv("LOG_LEVEL", "info"),
		LogFormat: getEnv("LOG_FORMAT", "json"),

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

func getEnvAsInt64(key string, defaultValue int64) int64 {
	str := getEnv(key, "")
	if str == "" {
		return defaultValue
	}
	val, err := strconv.ParseInt(str, 10, 64)
	if err != nil {
		return defaultValue
	}
	return val
}

func getEnvAsSlice(key string, defaultValue []string, sep string) []string {
	str := getEnv(key, "")
	if str == "" {
		return defaultValue
	}
	return strings.Split(str, sep)
}