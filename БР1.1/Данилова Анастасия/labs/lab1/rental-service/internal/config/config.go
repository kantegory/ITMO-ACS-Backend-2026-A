package config

import "os"

type Config struct {
	Port      string
	JWTSecret string
}

func Load() Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "5000"
	}

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "dev_secret_change_me"
	}

	return Config{
		Port:      port,
		JWTSecret: secret,
	}
}

