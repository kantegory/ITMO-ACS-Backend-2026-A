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

	"restaurant-booking/catalog-service/config"
	"restaurant-booking/catalog-service/docs"
	"restaurant-booking/catalog-service/internal/adapter/authclient"
	"restaurant-booking/catalog-service/internal/adapter/postgres"
	httpcontroller "restaurant-booking/catalog-service/internal/controller/http"
	menulist "restaurant-booking/catalog-service/internal/features/menu/list"
	restaurantdelete "restaurant-booking/catalog-service/internal/features/restaurant/delete"
	restaurantget "restaurant-booking/catalog-service/internal/features/restaurant/get"
	restaurantlist "restaurant-booking/catalog-service/internal/features/restaurant/list"
	reviewcreate "restaurant-booking/catalog-service/internal/features/review/create"
	reviewdelete "restaurant-booking/catalog-service/internal/features/review/delete"
	reviewget "restaurant-booking/catalog-service/internal/features/review/get"
	reviewlist "restaurant-booking/catalog-service/internal/features/review/list"
	reviewupdate "restaurant-booking/catalog-service/internal/features/review/update"
	internaltableget "restaurant-booking/catalog-service/internal/features/table/get"
	tablelist "restaurant-booking/catalog-service/internal/features/table/list"
	"restaurant-booking/catalog-service/pkg/jwt"
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

	authClient := authclient.New(cfg.AuthServiceURL)

	restaurantListUsecase := restaurantlist.NewUsecase(restaurantlist.NewPostgres(pgPool))
	restaurantGetUsecase := restaurantget.NewUsecase(restaurantget.NewPostgres(pgPool))
	restaurantDeleteUsecase := restaurantdelete.NewUsecase(restaurantdelete.NewPostgres(pgPool))
	menuListUsecase := menulist.NewUsecase(menulist.NewPostgres(pgPool))
	tableListUsecase := tablelist.NewUsecase(tablelist.NewPostgres(pgPool))
	reviewListUsecase := reviewlist.NewUsecase(reviewlist.NewPostgres(pgPool))
	reviewCreateUsecase := reviewcreate.NewUsecase(reviewcreate.NewPostgres(pgPool), authClient)
	reviewGetUsecase := reviewget.NewUsecase(reviewget.NewPostgres(pgPool))
	reviewUpdateUsecase := reviewupdate.NewUsecase(reviewupdate.NewPostgres(pgPool))
	reviewDeleteUsecase := reviewdelete.NewUsecase(reviewdelete.NewPostgres(pgPool))

	routes := httpcontroller.Routes{
		JWT: jwtCfg,
		Public: httpcontroller.PublicRoutes{
			RestaurantList:   restaurantlist.HTTP(restaurantListUsecase),
			RestaurantGet:    restaurantget.HTTP(restaurantGetUsecase),
			RestaurantDelete: restaurantdelete.HTTP(restaurantDeleteUsecase),
			MenuList:         menulist.HTTP(menuListUsecase),
			TableList:        tablelist.HTTP(tableListUsecase),
			ReviewList:       reviewlist.HTTP(reviewListUsecase),
			ReviewCreate:     reviewcreate.HTTP(reviewCreateUsecase),
			ReviewGet:        reviewget.HTTP(reviewGetUsecase),
			ReviewUpdate:     reviewupdate.HTTP(reviewUpdateUsecase),
			ReviewDelete:     reviewdelete.HTTP(reviewDeleteUsecase),
		},
		Internal: httpcontroller.InternalRoutes{
			RestaurantGet: restaurantget.InternalHTTP(pgPool),
			TableGet:      internaltableget.InternalHTTP(pgPool),
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
