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
		Port:               getenv("PORT", "8083"),
		DBURL:              os.Getenv("DB_URL"),
		JWTSecret:          getenv("JWT_SECRET", "dev_secret_change_me"),
		RabbitMQURL:        os.Getenv("RABBITMQ_URL"),
		PropertyServiceURL: getenv("PROPERTY_SERVICE_URL", "http://property-service:8082"),
		AuthServiceURL:     getenv("AUTH_SERVICE_URL", "http://auth-service:8081"),
	}
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
