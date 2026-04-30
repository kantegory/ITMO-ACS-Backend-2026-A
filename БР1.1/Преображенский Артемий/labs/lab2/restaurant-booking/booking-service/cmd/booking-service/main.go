package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	httpSwagger "github.com/swaggo/http-swagger"

	"restaurant-booking/booking-service/config"
	"restaurant-booking/booking-service/docs"
	"restaurant-booking/booking-service/internal/adapter/catalogclient"
	"restaurant-booking/booking-service/internal/adapter/postgres"
	httpcontroller "restaurant-booking/booking-service/internal/controller/http"
	"restaurant-booking/booking-service/internal/features/booking/availability"
	bookingcancel "restaurant-booking/booking-service/internal/features/booking/cancel"
	bookingcreate "restaurant-booking/booking-service/internal/features/booking/create"
	bookingget "restaurant-booking/booking-service/internal/features/booking/get"
	bookinglist "restaurant-booking/booking-service/internal/features/booking/list"
	"restaurant-booking/booking-service/pkg/jwt"
)

func main() {
	cfg, err := config.LoadConfig()
	if err != nil {
		panic(err)
	}
	if err := AppRun(context.Background(), cfg); err != nil {
		panic(err)
	}
}

func AppRun(ctx context.Context, cfg config.Config) error {
	pgPool, err := postgres.New(ctx, cfg.Postgres)
	if err != nil {
		return fmt.Errorf("postgres.New: %w", err)
	}

	jwtCfg := jwt.Config{Secret: []byte(cfg.JWTSecret)}

	catalogClient := catalogclient.New(cfg.CatalogServiceURL)

	availabilityUsecase := availability.NewUsecase(availability.NewPostgres(pgPool), catalogClient)
	createUsecase := bookingcreate.NewUsecase(bookingcreate.NewPostgres(pgPool), catalogClient)
	listUsecase := bookinglist.NewUsecase(bookinglist.NewPostgres(pgPool))
	getUsecase := bookingget.NewUsecase(bookingget.NewPostgres(pgPool))
	cancelUsecase := bookingcancel.NewUsecase(bookingcancel.NewPostgres(pgPool))

	routes := httpcontroller.Routes{
		JWT: jwtCfg,
		Public: httpcontroller.PublicRoutes{
			Availability:  availability.HTTP(availabilityUsecase),
			BookingCreate: bookingcreate.HTTP(createUsecase),
			BookingList:   bookinglist.HTTP(listUsecase),
			BookingGet:    bookingget.HTTP(getUsecase),
			BookingCancel: bookingcancel.HTTP(cancelUsecase),
		},
	}

	apiRouter := httpcontroller.Router(routes)

	root := chi.NewRouter()
	root.Get("/swagger/openapi.yaml", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/yaml")
		w.Write(docs.OpenAPISpec)
	})
	root.Get("/swagger/*", httpSwagger.Handler(
		httpSwagger.URL("/swagger/openapi.yaml"),
	))
	root.Mount("/", apiRouter)

	server := &http.Server{
		Addr:              cfg.HTTPAddr,
		Handler:           root,
		ReadHeaderTimeout: 5 * time.Second,
	}

	errCh := make(chan error, 1)
	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			errCh <- err
		}
	}()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, os.Interrupt, syscall.SIGTERM)

	select {
	case sig := <-sigCh:
		fmt.Printf("shutdown signal received: %s\n", sig.String())
	case err := <-errCh:
		pgPool.Close()
		return fmt.Errorf("http server: %w", err)
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		pgPool.Close()
		return fmt.Errorf("server shutdown: %w", err)
	}

	pgPool.Close()
	return nil
}
