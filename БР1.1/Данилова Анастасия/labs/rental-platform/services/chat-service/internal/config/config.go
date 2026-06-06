package config

import "os"

type Config struct {
	Port               string
	DBURL              string
	JWTSecret          string
	RabbitMQURL        string
	PropertyServiceURL string
	AuthServiceURL     string
}

func Load() Config {
	return Config{
		Port:               getenv("PORT", "8084"),
		DBURL:              os.Getenv("DB_URL"),
		JWTSecret:          getenv("JWT_SECRET", "dev_secret_change_me"),
		RabbitMQURL:        os.Getenv("RABBITMQ_URL"),
		PropertyServiceURL: os.Getenv("PROPERTY_SERVICE_URL"),
		AuthServiceURL:     os.Getenv("AUTH_SERVICE_URL"),
	}
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
