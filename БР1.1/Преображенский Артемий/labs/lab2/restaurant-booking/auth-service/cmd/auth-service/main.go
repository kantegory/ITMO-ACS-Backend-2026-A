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

	"restaurant-booking/auth-service/config"
	"restaurant-booking/auth-service/docs"
	"restaurant-booking/auth-service/internal/adapter/postgres"
	"restaurant-booking/auth-service/internal/adapter/rabbitmq"
	httpcontroller "restaurant-booking/auth-service/internal/controller/http"
	"restaurant-booking/auth-service/internal/features/login"
	"restaurant-booking/auth-service/internal/features/me"
	"restaurant-booking/auth-service/internal/features/register"
	userget "restaurant-booking/auth-service/internal/features/user-get"
	"restaurant-booking/auth-service/pkg/jwt"
)

const rabbitUserExchangeName = "restaurant.user"
const rabbitUserRoutingKey = "user.registered"

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

	var rmqPublisher *rabbitmq.Publisher
	if cfg.RabbitMQURL != "" {
		p, err := rabbitmq.NewPublisher(cfg.RabbitMQURL)
		if err != nil {
			pgPool.Close()
			return fmt.Errorf("rabbitmq.NewPublisher: %w", err)
		}
		rmqPublisher = p
	}

	jwtDur, err := time.ParseDuration(cfg.JWTExpires)
	if err != nil {
		jwtDur = 24 * time.Hour
	}
	jwtCfg := jwt.Config{
		Secret:  []byte(cfg.JWTSecret),
		Expires: jwtDur,
	}

	var registerPublisher register.Publisher
	if rmqPublisher != nil {
		registerPublisher = register.NewPublisher(rmqPublisher, rabbitUserExchangeName, rabbitUserRoutingKey)
	}
	registerUsecase := register.NewUsecase(register.NewPostgres(pgPool), jwtCfg, registerPublisher)
	loginUsecase := login.NewUsecase(login.NewPostgres(pgPool), jwtCfg)
	meUsecase := me.NewUsecase(me.NewPostgres(pgPool))
	userGetUsecase := userget.NewUsecase(userget.NewPostgres(pgPool))

	routes := httpcontroller.Routes{
		JWT: jwtCfg,
		Public: httpcontroller.PublicRoutes{
			Register: register.HTTP(registerUsecase),
			Login:    login.HTTP(loginUsecase),
			Profile:  me.HTTP(meUsecase),
		},
		Internal: httpcontroller.InternalRoutes{
			UserGet: userget.HTTP(userGetUsecase),
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
		if rmqPublisher != nil {
			rmqPublisher.Close()
		}
		pgPool.Close()
		return fmt.Errorf("http server: %w", err)
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		if rmqPublisher != nil {
			rmqPublisher.Close()
		}
		pgPool.Close()
		return fmt.Errorf("server shutdown: %w", err)
	}

	if rmqPublisher != nil {
		rmqPublisher.Close()
	}
	pgPool.Close()

	return nil
}
