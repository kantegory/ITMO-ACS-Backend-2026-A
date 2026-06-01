package main

import (
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"strconv"

	"github.com/borodin-maksim/restaurant-booking/auth-service/internal/app"
	"github.com/borodin-maksim/restaurant-booking/auth-service/internal/infrastructure/database"
)

func main() {
	log := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))

	port, err := strconv.Atoi(env("DB_PORT", "5432"))
	if err != nil {
		log.Error("invalid DB_PORT", "error", err)
		os.Exit(1)
	}

	db, err := database.NewPostgresDB(
		env("DB_HOST", "localhost"),
		port,
		env("DB_USER", "postgres"),
		env("DB_PASSWORD", "postgres"),
		env("DB_NAME", "auth_db"),
		env("DB_SSLMODE", "disable"),
	)
	if err != nil {
		log.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	log.Info("connected to database")

	router := app.NewRouter(app.Deps{
		Log:       log,
		JWTSecret: env("JWT_SECRET", "supersecretkey"),
		DB:        db.DB(),
	})

	addr := fmt.Sprintf("%s:%s", env("SERVER_HOST", "0.0.0.0"), env("SERVER_PORT", "8081"))
	log.Info("starting auth-service", "addr", addr)

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
