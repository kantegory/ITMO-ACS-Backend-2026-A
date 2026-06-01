package main

import (
	"fmt"
	"log/slog"
	"net/http"
	"os"

	"github.com/borodin-maksim/restaurant-booking/api-gateway/internal/app"
)

func main() {
	log := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))

	cfg := app.Config{
		Log:                  log,
		JWTSecret:            env("JWT_SECRET", "supersecretkey"),
		AuthServiceURL:       env("AUTH_SERVICE_URL", "http://localhost:8081"),
		RestaurantServiceURL: env("RESTAURANT_SERVICE_URL", "http://localhost:8082"),
		BookingServiceURL:    env("BOOKING_SERVICE_URL", "http://localhost:8083"),
	}

	router := app.NewRouter(cfg)

	addr := fmt.Sprintf("%s:%s", env("SERVER_HOST", "0.0.0.0"), env("SERVER_PORT", "8080"))
	log.Info("starting api-gateway", "addr", addr)

	if err := http.ListenAndServe(addr, router); err != nil {
		log.Error("server failed", "error", err)
		os.Exit(1)
	}
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
