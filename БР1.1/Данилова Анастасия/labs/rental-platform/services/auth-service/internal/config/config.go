package config

import "os"

type Config struct {
	Port        string
	DBURL       string
	JWTSecret   string
	RabbitMQURL string
}

func Load() Config {
	port := getenv("PORT", "8081")
	return Config{
		Port:        port,
		DBURL:       os.Getenv("DB_URL"),
		JWTSecret:   getenv("JWT_SECRET", "dev_secret_change_me"),
		RabbitMQURL: os.Getenv("RABBITMQ_URL"),
	}
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
