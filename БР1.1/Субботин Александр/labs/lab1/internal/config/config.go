package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Env       string
	WebPort   string
	DBHost    string
	DBPort    string
	DBUser    string
	DBPass    string
	DBName    string
	DBSSLMode string
	JWTSecret string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	cfg := &Config{
		Env:       getEnv("ENV", "local"),
		WebPort:   getEnv("WEB_PORT", ":8080"),
		DBHost:    getEnv("DB_HOST", "localhost"),
		DBPort:    getEnv("DB_PORT", "5432"),
		DBUser:    getEnv("DB_USER", "postgres"),
		DBPass:    getEnv("DB_PASSWORD", "postgres"),
		DBName:    getEnv("DB_NAME", "rental_db"),
		DBSSLMode: getEnv("DB_SSLMODE", "disable"),
		JWTSecret: getEnv("JWT_SECRET", "supersecretkey"),
	}

	return cfg, nil
}

func (c *Config) DSN() string {
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		c.DBHost, c.DBPort, c.DBUser, c.DBPass, c.DBName, c.DBSSLMode,
	)
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
