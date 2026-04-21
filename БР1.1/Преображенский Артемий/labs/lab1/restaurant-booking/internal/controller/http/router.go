package http

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"

	"restaurant-booking/pkg/jwt"
	appmiddleware "restaurant-booking/pkg/middleware"
)

type AuthRoutes struct {
	Register http.HandlerFunc
	Login    http.HandlerFunc
	Profile  http.HandlerFunc
}

type MeRoutes struct {
	BookingList   http.HandlerFunc
	BookingGet    http.HandlerFunc
	BookingCancel http.HandlerFunc
}

type RestaurantRoutes struct {
	List         http.HandlerFunc
	Get          http.HandlerFunc
	Delete       http.HandlerFunc
	Menu         http.HandlerFunc
	ReviewsList  http.HandlerFunc
	ReviewCreate http.HandlerFunc
	ReviewGet    http.HandlerFunc
	ReviewUpdate http.HandlerFunc
	ReviewDelete http.HandlerFunc
	Tables       http.HandlerFunc
	Availability http.HandlerFunc
}

type BookingRoutes struct {
	Create http.HandlerFunc
}

type Routes struct {
	Auth        AuthRoutes
	Me          MeRoutes
	Restaurants RestaurantRoutes
	Bookings    BookingRoutes
	JWT         jwt.Config
}

func Router(routes Routes) http.Handler {
	r := chi.NewRouter()
	r.Use(appmiddleware.RequestLog)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.Timeout(60 * time.Second))

	auth := appmiddleware.Auth(routes.JWT)

	r.Route("/api", func(r chi.Router) {
		r.Route("/auth", func(r chi.Router) {
			r.Post("/register", routes.Auth.Register)
			r.Post("/login", routes.Auth.Login)
			r.With(auth).Get("/me", routes.Auth.Profile)
		})

		r.With(auth).Post("/bookings", routes.Bookings.Create)

		r.Route("/me", func(r chi.Router) {
			r.Use(auth)
			r.Get("/bookings", routes.Me.BookingList)
			r.Get("/bookings/{bookingID}", routes.Me.BookingGet)
			r.Delete("/bookings/{bookingID}", routes.Me.BookingCancel)
		})

		r.Route("/restaurants", func(r chi.Router) {
			r.Get("/", routes.Restaurants.List)
			r.Route("/{id}", func(r chi.Router) {
				r.Get("/", routes.Restaurants.Get)
				r.With(auth).Delete("/", routes.Restaurants.Delete)
				r.Get("/menu", routes.Restaurants.Menu)
				r.Get("/reviews", routes.Restaurants.ReviewsList)
				r.With(auth).Post("/reviews", routes.Restaurants.ReviewCreate)
				r.Get("/reviews/{reviewID}", routes.Restaurants.ReviewGet)
				r.With(auth).Put("/reviews/{reviewID}", routes.Restaurants.ReviewUpdate)
				r.With(auth).Delete("/reviews/{reviewID}", routes.Restaurants.ReviewDelete)
				r.Get("/tables", routes.Restaurants.Tables)
				r.Get("/tables/{tableID}/availability", routes.Restaurants.Availability)
			})
		})
	})

	return r
}
