package main

import (
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"

	"auth-service/internal/api"
	authhandler "auth-service/internal/api/handler/auth"
	internalhandler "auth-service/internal/api/handler/internalapi"
	"auth-service/internal/infrastructure/client"
	"auth-service/internal/infrastructure/database"
	"auth-service/internal/infrastructure/events"
	authuc "auth-service/internal/usecase/auth"
	"auth-service/pkg/slogutil"
)

func main() {
	slogutil.Setup("auth-service")
	ctx := context.Background()
	log := slogutil.Logger(ctx, slogutil.LayerMain, "bootstrap")

	databaseURL := env("DATABASE_URL", "postgres://auth:auth@localhost:5432/auth?sslmode=disable")
	jwtSecret := env("JWT_SECRET", "dev-secret-change-me")
	port := env("PORT", "8081")
	profileURL := env("PROFILE_SERVICE_URL", "http://localhost:8082")
	kafkaBroker := env("KAFKA_BROKER", "")
	kafkaTopic := env("KAFKA_USER_CREATED_TOPIC", "user.created")

	if err := runMigrations(databaseURL, env("MIGRATIONS_PATH", "file://migrations")); err != nil {
		log.Error("migrations failed", "error", err)
		os.Exit(1)
	}

	pool, err := database.NewPool(ctx, databaseURL)
	if err != nil {
		log.Error("database connection failed", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	userRepo := database.NewUserRepository(pool)
	tokens := authuc.NewJWTProvider(jwtSecret, 24*time.Hour)
	profileClient := client.NewProfileClient(profileURL)

	var publisher events.Publisher = events.NoopPublisher{}
	if kafkaBroker != "" {
		kp := events.NewKafkaPublisher(kafkaBroker, kafkaTopic)
		defer kp.Close()
		publisher = kp
	}

	authUseCase := authuc.NewUseCase(userRepo, profileClient, publisher, tokens)

	router := api.NewRouter(api.Handlers{
		Auth:     authhandler.NewHandler(authUseCase),
		Internal: internalhandler.NewHandler(authUseCase),
	})

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Info("http server listening", "addr", ":"+port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Error("http server failed", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = srv.Shutdown(shutdownCtx)
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func runMigrations(databaseURL, migrationsPath string) error {
	m, err := migrate.New(migrationsPath, databaseURL)
	if err != nil {
		return err
	}
	defer m.Close()
	if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return err
	}
	return nil
}
