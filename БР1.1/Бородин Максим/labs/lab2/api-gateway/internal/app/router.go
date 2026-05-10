package app

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"

	"github.com/borodin-maksim/restaurant-booking/api-gateway/internal/middleware"
	"github.com/borodin-maksim/restaurant-booking/api-gateway/internal/proxy"
)

type Config struct {
	Log                  *slog.Logger
	JWTSecret            string
	AuthServiceURL       string
	RestaurantServiceURL string
	BookingServiceURL    string
}

func NewRouter(cfg Config) http.Handler {
	authProxy := proxy.New(cfg.AuthServiceURL)
	restaurantProxy := proxy.New(cfg.RestaurantServiceURL)
	bookingProxy := proxy.New(cfg.BookingServiceURL)

	r := chi.NewRouter()
	r.Use(middleware.Recovery(cfg.Log))
	r.Use(middleware.Logger(cfg.Log))
	r.Use(chimw.RequestID)

	// Public auth routes
	r.Post("/register", authProxy.ServeHTTP)
	r.Post("/login", authProxy.ServeHTTP)

	// Public restaurant browsing routes
	r.Get("/restaurants", restaurantProxy.ServeHTTP)
	r.Get("/restaurants/{id}", restaurantProxy.ServeHTTP)
	r.Get("/restaurants/{id}/menu", restaurantProxy.ServeHTTP)
	r.Get("/restaurants/{id}/reviews", restaurantProxy.ServeHTTP)

	// Public table availability (proxied to booking-service)
	r.Get("/restaurants/{id}/tables/availability", bookingProxy.ServeHTTP)

	// Authenticated routes
	r.Group(func(r chi.Router) {
		r.Use(middleware.Auth(cfg.JWTSecret))

		// Profile (auth-service)
		r.Get("/profile", authProxy.ServeHTTP)

		// User-only routes
		r.Group(func(r chi.Router) {
			r.Use(middleware.RequireRole("user"))
			r.Post("/restaurants/{id}/reviews", restaurantProxy.ServeHTTP)
			r.Post("/bookings", bookingProxy.ServeHTTP)
			r.Get("/bookings/my", bookingProxy.ServeHTTP)
			r.Post("/bookings/{id}/cancel", bookingProxy.ServeHTTP)
		})

		// Admin-only routes
		r.Group(func(r chi.Router) {
			r.Use(middleware.RequireRole("admin"))
			r.Post("/admin/restaurants", restaurantProxy.ServeHTTP)
			r.Post("/admin/restaurants/{id}/tables", restaurantProxy.ServeHTTP)
			r.Get("/admin/bookings", bookingProxy.ServeHTTP)
		})
	})

	return r
}
