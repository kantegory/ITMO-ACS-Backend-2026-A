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

	"profile-service/internal/api"
	candidatehandler "profile-service/internal/api/handler/candidate"
	employerhandler "profile-service/internal/api/handler/employer"
	internalhandler "profile-service/internal/api/handler/internalapi"
	"profile-service/internal/infrastructure/database"
	"profile-service/internal/infrastructure/events"
	authuc "profile-service/internal/usecase/auth"
	candidateuc "profile-service/internal/usecase/candidate"
	profileuc "profile-service/internal/usecase/profile"
	"profile-service/pkg/slogutil"
)

func main() {
	slogutil.Setup("profile-service")
	ctx := context.Background()
	log := slogutil.Logger(ctx, slogutil.LayerMain, "bootstrap")

	databaseURL := env("DATABASE_URL", "postgres://profile:profile@localhost:5432/profile?sslmode=disable")
	jwtSecret := env("JWT_SECRET", "dev-secret-change-me")
	port := env("PORT", "8082")
	kafkaBroker := env("KAFKA_BROKER", "")
	kafkaTopic := env("KAFKA_USER_CREATED_TOPIC", "user.created")
	kafkaGroup := env("KAFKA_CONSUMER_GROUP", "profile-service")

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

	candidateRepo := database.NewCandidateRepository(pool)
	employerRepo := database.NewEmployerRepository(pool)
	resumeRepo := database.NewResumeRepository(pool)

	tokens := authuc.NewJWTProvider(jwtSecret)
	profileUseCase := profileuc.NewUseCase(candidateRepo, employerRepo)
	candidateUseCase := candidateuc.NewUseCase(candidateRepo, resumeRepo)

	if kafkaBroker != "" {
		consumer := events.NewUserCreatedConsumer(kafkaBroker, kafkaTopic, kafkaGroup, profileUseCase)
		defer consumer.Close()
		go consumer.Start(ctx)
	}

	router := api.NewRouter(api.Handlers{
		Candidate: candidatehandler.NewHandler(candidateUseCase),
		Employer:  employerhandler.NewHandler(profileUseCase),
		Internal:  internalhandler.NewHandler(profileUseCase),
		Tokens:    tokens,
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
