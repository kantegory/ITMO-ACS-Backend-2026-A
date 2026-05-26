package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DBHost         string
	DBUser         string
	DBPassword     string
	DBName         string
	DBPort         string
	Port           string
	AuthServiceURL string
}

func LoadConfig() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: Error loading .env file, using system environment variables")
	}

	return &Config{
		DBHost:         getEnv("DB_HOST", "localhost"),
		DBUser:         getEnv("DB_USER", "postgres"),
		DBPassword:     getEnv("DB_PASSWORD", "postgres"),
		DBName:         getEnv("DB_NAME", "profile_db"),
		DBPort:         getEnv("DB_PORT", "5432"),
		Port:           getEnv("PORT", "8082"),
		AuthServiceURL: getEnv("AUTH_SERVICE_URL", "http://auth-service:8081"),
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
