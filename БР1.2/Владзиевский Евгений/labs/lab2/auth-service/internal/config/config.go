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

	ServiceToken string

	KafkaBrokers string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	c := &Config{
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnvAsInt("DB_PORT", 5432),
		DBUser:     getEnv("DB_USER", "auth"),
		DBPassword: getEnv("DB_PASSWORD", "authpass"),
		DBName:     getEnv("DB_NAME", "auth_db"),
		DBSSLMode:  getEnv("DB_SSLMODE", "disable"),

		ServerPort: getEnvAsInt("SERVER_PORT", 8081),
		ServerHost: getEnv("SERVER_HOST", "0.0.0.0"),

		JWTSecret:        getEnv("JWT_SECRET", "rental-microservices-secret-key"),
		JWTAccessExpire:  getEnv("JWT_ACCESS_EXPIRE", "24h"),
		JWTRefreshExpire: getEnv("JWT_REFRESH_EXPIRE", "168h"),

		ServiceToken: getEnv("SERVICE_TOKEN", "internal-service-token"),

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

func getEnvAsSlice(key string, defaultValue []string, sep string) []string {
	str := getEnv(key, "")
	if str == "" {
		return defaultValue
	}
	return strings.Split(str, sep)
}