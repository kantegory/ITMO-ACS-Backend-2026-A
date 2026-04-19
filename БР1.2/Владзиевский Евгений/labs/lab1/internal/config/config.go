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

	JWTSecret        string
	JWTAccessExpire  string
	JWTRefreshExpire string

	UploadDir         string
	MaxUploadSize     int64
	AllowedImageTypes []string

	LogLevel  string
	LogFormat string

	RateLimitRequests int
	RateLimitWindow   string
}

func Load() (*Config, error) {
	// Load .env file if exists
	_ = godotenv.Load()

	c := &Config{
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnvAsInt("DB_PORT", 5432),
		DBUser:     getEnv("DB_USER", "rental"),
		DBPassword: getEnv("DB_PASSWORD", "rentalpass"),
		DBName:     getEnv("DB_NAME", "rental_db"),
		DBSSLMode:  getEnv("DB_SSLMODE", "disable"),

		ServerPort: getEnvAsInt("SERVER_PORT", 8080),
		ServerHost: getEnv("SERVER_HOST", "0.0.0.0"),

		JWTSecret:        getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
		JWTAccessExpire:  getEnv("JWT_ACCESS_EXPIRE", "24h"),
		JWTRefreshExpire: getEnv("JWT_REFRESH_EXPIRE", "168h"),

		UploadDir:         getEnv("UPLOAD_DIR", "./storage"),
		MaxUploadSize:     getEnvAsInt64("MAX_UPLOAD_SIZE", 10*1024*1024), // 10MB
		AllowedImageTypes: getEnvAsSlice("ALLOWED_IMAGE_TYPES", []string{"image/jpeg", "image/png", "image/gif"}, ","),

		LogLevel:  getEnv("LOG_LEVEL", "info"),
		LogFormat: getEnv("LOG_FORMAT", "json"),

		RateLimitRequests: getEnvAsInt("RATE_LIMIT_REQUESTS", 100),
		RateLimitWindow:   getEnv("RATE_LIMIT_WINDOW", "60s"),
	}

	// Validate required fields
	if c.JWTSecret == "your-secret-key-change-in-production" {
		fmt.Println("WARNING: Using default JWT secret. Change JWT_SECRET in production.")
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
