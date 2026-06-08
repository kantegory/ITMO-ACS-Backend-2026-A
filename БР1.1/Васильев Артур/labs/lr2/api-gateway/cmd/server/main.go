package main

import (
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"api-gateway/internal/api"
	"api-gateway/pkg/httputil"
	"api-gateway/pkg/slogutil"
)

func main() {
	slogutil.Setup("api-gateway")
	ctx := context.Background()
	log := slogutil.Logger(ctx, slogutil.LayerMain, "bootstrap")

	authURL := env("AUTH_SERVICE_URL", "http://localhost:8081")
	profileURL := env("PROFILE_SERVICE_URL", "http://localhost:8082")
	vacancyURL := env("VACANCY_SERVICE_URL", "http://localhost:8083")
	port := env("PORT", "8080")

	authProxy, err := httputil.NewReverseProxy(authURL)
	if err != nil {
		log.Error("auth proxy failed", "error", err)
		os.Exit(1)
	}
	profileProxy, err := httputil.NewReverseProxy(profileURL)
	if err != nil {
		log.Error("profile proxy failed", "error", err)
		os.Exit(1)
	}
	vacancyProxy, err := httputil.NewReverseProxy(vacancyURL)
	if err != nil {
		log.Error("vacancy proxy failed", "error", err)
		os.Exit(1)
	}

	router := api.NewRouter(api.ProxyHandlers{
		Auth:    authProxy,
		Profile: profileProxy,
		Vacancy: vacancyProxy,
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
