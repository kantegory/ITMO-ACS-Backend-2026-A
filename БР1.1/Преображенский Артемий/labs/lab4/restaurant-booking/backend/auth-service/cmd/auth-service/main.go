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
	internalgetuser "restaurant-booking/auth-service/internal/features/internal-get-user"
	"restaurant-booking/auth-service/internal/features/login"
	"restaurant-booking/auth-service/internal/features/me"
	"restaurant-booking/auth-service/internal/features/register"
	"restaurant-booking/auth-service/pkg/jwt"
)

const rabbitUserExchangeName = "restaurant.user"
const rabbitUserRoutingKey = "user.registered"

var revision = "local"

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
	if err != nil || jwtDur <= 0 {
		if rmqPublisher != nil {
			_ = rmqPublisher.Close()
		}
		pgPool.Close()
		return fmt.Errorf("JWT_EXPIRES must be a positive duration")
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
	userGetUsecase := internalgetuser.NewUsecase(internalgetuser.NewPostgres(pgPool))

	routes := httpcontroller.Routes{
		JWT: jwtCfg,
		Public: httpcontroller.PublicRoutes{
			Register: register.HTTP(registerUsecase),
			Login:    login.HTTP(loginUsecase),
			Profile:  me.HTTP(meUsecase),
		},
		Internal: httpcontroller.InternalRoutes{
			UserGet: internalgetuser.HTTP(userGetUsecase),
		},
	}

	apiRouter := httpcontroller.Router(routes)

	root := chi.NewRouter()
	root.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("X-App-Revision", revision)
			next.ServeHTTP(w, r)
		})
	})
	root.Get("/ready", func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), time.Second)
		defer cancel()
		if err := pgPool.Pgx().Ping(ctx); err != nil {
			http.Error(w, "database unavailable", http.StatusServiceUnavailable)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = fmt.Fprintln(w, `{"status":"ready"}`)
	})
	root.Get("/swagger/openapi.yaml", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/yaml")
		w.Write(docs.OpenAPISpec)
	})
	root.Get("/swagger/*", httpSwagger.Handler(
		httpSwagger.URL("/swagger/openapi.yaml"),
	))
	root.Get("/docs/auth/openapi.yaml", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/yaml")
		_, _ = w.Write(docs.OpenAPISpec)
	})
	root.Get("/docs/auth/*", httpSwagger.Handler(httpSwagger.URL("/docs/auth/openapi.yaml")))
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
	defer signal.Stop(sigCh)

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
