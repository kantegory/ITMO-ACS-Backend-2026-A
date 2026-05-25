package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DBHost            string
	DBUser            string
	DBPassword        string
	DBName            string
	DBPort            string
	Port              string
	ProfileServiceURL string
	ResumeServiceURL  string
}

func LoadConfig() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: Error loading .env file, using system environment variables")
	}

	return &Config{
		DBHost:            getEnv("DB_HOST", "localhost"),
		DBUser:            getEnv("DB_USER", "postgres"),
		DBPassword:        getEnv("DB_PASSWORD", "postgres"),
		DBName:            getEnv("DB_NAME", "job_db"),
		DBPort:            getEnv("DB_PORT", "5432"),
		Port:              getEnv("PORT", "8084"),
		ProfileServiceURL: getEnv("PROFILE_SERVICE_URL", "http://profile-service:8082"),
		ResumeServiceURL:  getEnv("RESUME_SERVICE_URL", "http://resume-service:8083"),
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
