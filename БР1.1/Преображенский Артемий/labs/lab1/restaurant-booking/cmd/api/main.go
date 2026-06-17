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

	"restaurant-booking/config"
	"restaurant-booking/docs"
	"restaurant-booking/internal/adapter/postgres"
	httpcontroller "restaurant-booking/internal/controller/http"
	"restaurant-booking/internal/features/auth/login"
	"restaurant-booking/internal/features/auth/me"
	"restaurant-booking/internal/features/auth/register"
	bookingavailability "restaurant-booking/internal/features/booking/availability"
	bookingcancel "restaurant-booking/internal/features/booking/cancel"
	bookingcreate "restaurant-booking/internal/features/booking/create"
	bookingget "restaurant-booking/internal/features/booking/get"
	bookinglist "restaurant-booking/internal/features/booking/list"
	menulist "restaurant-booking/internal/features/menu/list"
	restaurantdelete "restaurant-booking/internal/features/restaurant/delete"
	restaurantget "restaurant-booking/internal/features/restaurant/get"
	restaurantlist "restaurant-booking/internal/features/restaurant/list"
	reviewcreate "restaurant-booking/internal/features/review/create"
	reviewdelete "restaurant-booking/internal/features/review/delete"
	reviewget "restaurant-booking/internal/features/review/get"
	reviewlist "restaurant-booking/internal/features/review/list"
	reviewupdate "restaurant-booking/internal/features/review/update"
	tablelist "restaurant-booking/internal/features/table/list"
	"restaurant-booking/pkg/jwt"
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

	jwtDur, err := time.ParseDuration(cfg.JWTExpires)
	if err != nil {
		jwtDur = 24 * time.Hour
	}
	jwtCfg := jwt.Config{
		Secret:  []byte(cfg.JWTSecret),
		Expires: jwtDur,
	}

	registerRepo := register.NewPostgres(pgPool)
	loginRepo := login.NewPostgres(pgPool)
	meRepo := me.NewPostgres(pgPool)

	bookingCreateRepo := bookingcreate.NewPostgres(pgPool)
	bookingListRepo := bookinglist.NewPostgres(pgPool)
	bookingGetRepo := bookingget.NewPostgres(pgPool)
	bookingCancelRepo := bookingcancel.NewPostgres(pgPool)
	bookingAvailabilityRepo := bookingavailability.NewPostgres(pgPool)

	restaurantListRepo := restaurantlist.NewPostgres(pgPool)
	restaurantListUsecase := restaurantlist.NewUsecase(restaurantListRepo)

	restaurantGetRepo := restaurantget.NewPostgres(pgPool)
	restaurantGetUsecase := restaurantget.NewUsecase(restaurantGetRepo)

	restaurantDeleteRepo := restaurantdelete.NewPostgres(pgPool)
	restaurantDeleteUsecase := restaurantdelete.NewUsecase(restaurantDeleteRepo)

	menuListRepo := menulist.NewPostgres(pgPool)
	menuListUsecase := menulist.NewUsecase(menuListRepo)

	reviewListRepo := reviewlist.NewPostgres(pgPool)
	reviewListUsecase := reviewlist.NewUsecase(reviewListRepo)

	reviewCreateRepo := reviewcreate.NewPostgres(pgPool)
	reviewCreateUsecase := reviewcreate.NewUsecase(reviewCreateRepo)

	reviewGetRepo := reviewget.NewPostgres(pgPool)
	reviewGetUsecase := reviewget.NewUsecase(reviewGetRepo)

	reviewUpdateRepo := reviewupdate.NewPostgres(pgPool)
	reviewUpdateUsecase := reviewupdate.NewUsecase(reviewUpdateRepo)

	reviewDeleteRepo := reviewdelete.NewPostgres(pgPool)
	reviewDeleteUsecase := reviewdelete.NewUsecase(reviewDeleteRepo)

	tableListRepo := tablelist.NewPostgres(pgPool)
	tableListUsecase := tablelist.NewUsecase(tableListRepo)

	bookingAvailabilityUsecase := bookingavailability.NewUsecase(bookingAvailabilityRepo)
	bookingCreateUsecase := bookingcreate.NewUsecase(bookingCreateRepo)
	bookingListUsecase := bookinglist.NewUsecase(bookingListRepo)
	bookingGetUsecase := bookingget.NewUsecase(bookingGetRepo)
	bookingCancelUsecase := bookingcancel.NewUsecase(bookingCancelRepo)

	registerUsecase := register.NewUsecase(registerRepo, jwtCfg)
	loginUsecase := login.NewUsecase(loginRepo, jwtCfg)
	meUsecase := me.NewUsecase(meRepo)

	routes := httpcontroller.Routes{
		JWT: jwtCfg,
		Auth: httpcontroller.AuthRoutes{
			Register: register.HTTP(registerUsecase),
			Login:    login.HTTP(loginUsecase),
			Profile:  me.HTTP(meUsecase),
		},
		Me: httpcontroller.MeRoutes{
			BookingList:   bookinglist.HTTP(bookingListUsecase),
			BookingGet:    bookingget.HTTP(bookingGetUsecase),
			BookingCancel: bookingcancel.HTTP(bookingCancelUsecase),
		},
		Restaurants: httpcontroller.RestaurantRoutes{
			List:         restaurantlist.HTTP(restaurantListUsecase),
			Get:          restaurantget.HTTP(restaurantGetUsecase),
			Delete:       restaurantdelete.HTTP(restaurantDeleteUsecase),
			Menu:         menulist.HTTP(menuListUsecase),
			ReviewsList:  reviewlist.HTTP(reviewListUsecase),
			ReviewCreate: reviewcreate.HTTP(reviewCreateUsecase),
			ReviewGet:    reviewget.HTTP(reviewGetUsecase),
			ReviewUpdate: reviewupdate.HTTP(reviewUpdateUsecase),
			ReviewDelete: reviewdelete.HTTP(reviewDeleteUsecase),
			Tables:       tablelist.HTTP(tableListUsecase),
			Availability: bookingavailability.HTTP(bookingAvailabilityUsecase),
		},
		Bookings: httpcontroller.BookingRoutes{
			Create: bookingcreate.HTTP(bookingCreateUsecase),
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
