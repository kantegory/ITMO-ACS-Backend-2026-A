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

	"vacancy-service/internal/api"
	employerhandler "vacancy-service/internal/api/handler/employer"
	referencehandler "vacancy-service/internal/api/handler/reference"
	vacancyhandler "vacancy-service/internal/api/handler/vacancy"
	"vacancy-service/internal/infrastructure/client"
	"vacancy-service/internal/infrastructure/database"
	"vacancy-service/internal/infrastructure/events"
	authuc "vacancy-service/internal/usecase/auth"
	employeruc "vacancy-service/internal/usecase/employer"
	referenceuc "vacancy-service/internal/usecase/reference"
	vacancyuc "vacancy-service/internal/usecase/vacancy"
	"vacancy-service/pkg/slogutil"
)

func main() {
	slogutil.Setup("vacancy-service")
	ctx := context.Background()
	log := slogutil.Logger(ctx, slogutil.LayerMain, "bootstrap")

	databaseURL := env("DATABASE_URL", "postgres://vacancy:vacancy@localhost:5432/vacancy?sslmode=disable")
	jwtSecret := env("JWT_SECRET", "dev-secret-change-me")
	port := env("PORT", "8083")
	profileURL := env("PROFILE_SERVICE_URL", "http://localhost:8082")
	kafkaBroker := env("KAFKA_BROKER", "")
	kafkaTopic := env("KAFKA_VACANCY_PUBLISHED_TOPIC", "vacancy.published")

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

	vacancyRepo := database.NewVacancyRepository(pool)
	refRepo := database.NewReferenceRepository(pool)
	profileClient := client.NewProfileClient(profileURL)
	tokens := authuc.NewJWTProvider(jwtSecret)

	var publisher events.Publisher = events.NoopPublisher{}
	if kafkaBroker != "" {
		kp := events.NewKafkaPublisher(kafkaBroker, kafkaTopic)
		defer kp.Close()
		publisher = kp
	}

	employerUseCase := employeruc.NewUseCase(vacancyRepo, refRepo, profileClient, publisher)
	vacancyUseCase := vacancyuc.NewUseCase(vacancyRepo)
	referenceUseCase := referenceuc.NewUseCase(refRepo)

	router := api.NewRouter(api.Handlers{
		Employer:  employerhandler.NewHandler(employerUseCase),
		Vacancy:   vacancyhandler.NewHandler(vacancyUseCase),
		Reference: referencehandler.NewHandler(referenceUseCase),
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
