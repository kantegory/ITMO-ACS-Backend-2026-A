package main

import (
	"gateway/internal/middleware"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
)

func proxyHandler(proxy *httputil.ReverseProxy) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		reqID := chimiddleware.GetReqID(r.Context())
		r.Header.Set("X-Request-Id", reqID)
		proxy.ServeHTTP(w, r)
	}
}

func main() {
	r := chi.NewRouter()

	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.Heartbeat("/ping"))

	authURL, _ := url.Parse("http://auth-service:8001")
	catalogURL, _ := url.Parse("http://catalog-service:8002")
	bookingURL, _ := url.Parse("http://booking-service:8003")
	reviewURL, _ := url.Parse("http://review-service:8004")

	authProxy := httputil.NewSingleHostReverseProxy(authURL)
	catalogProxy := httputil.NewSingleHostReverseProxy(catalogURL)
	bookingProxy := httputil.NewSingleHostReverseProxy(bookingURL)
	reviewProxy := httputil.NewSingleHostReverseProxy(reviewURL)

	r.Handle("/auth/*", proxyHandler(authProxy))
	r.Handle("/api/v1/catalog/restaurants/{id}/reviews", proxyHandler(reviewProxy))
	r.Handle("/api/v1/catalog/*", proxyHandler(catalogProxy))

	r.Route("/api/v1/bookings", func(r chi.Router) {
		r.Use(middleware.AuthMiddleware)
		r.HandleFunc("/*", proxyHandler(bookingProxy))
	})

	r.Route("/api/v1/reviews", func(r chi.Router) {
		r.Use(middleware.AuthMiddleware)
		r.Post("/", proxyHandler(reviewProxy))
	})

	log.Println("API Gateway starting on :8080...")
	http.ListenAndServe(":8080", r)
}
