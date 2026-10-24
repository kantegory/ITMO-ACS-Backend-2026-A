package config

import "os"

type Config struct {
	Port           string
	DBURL          string
	JWTSecret      string
	RabbitMQURL    string
	AuthServiceURL string
}

func Load() Config {
	return Config{
		Port:           getenv("PORT", "8082"),
		DBURL:          os.Getenv("DB_URL"),
		JWTSecret:      getenv("JWT_SECRET", "dev_secret_change_me"),
		RabbitMQURL:    os.Getenv("RABBITMQ_URL"),
		AuthServiceURL: os.Getenv("AUTH_SERVICE_URL"),
	}
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
