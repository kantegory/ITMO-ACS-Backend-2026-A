package http

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"

	"restaurant-booking/booking-service/pkg/jwt"
	appmiddleware "restaurant-booking/booking-service/pkg/middleware"
)

type PublicRoutes struct {
	Availability  http.HandlerFunc
	BookingCreate http.HandlerFunc
	BookingList   http.HandlerFunc
	BookingGet    http.HandlerFunc
	BookingCancel http.HandlerFunc
}

type Routes struct {
	Public PublicRoutes
	JWT    jwt.Config
}

func Router(routes Routes) http.Handler {
	r := chi.NewRouter()
	r.Use(appmiddleware.RequestLog)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.Timeout(60 * time.Second))

	auth := appmiddleware.Auth(routes.JWT)

	r.Route("/api", func(r chi.Router) {
		r.With(auth).Get("/restaurants/{id}/tables/{tableID}/availability", routes.Public.Availability)

		r.With(auth).Post("/bookings", routes.Public.BookingCreate)

		r.Route("/me", func(r chi.Router) {
			r.Use(auth)
			r.Get("/bookings", routes.Public.BookingList)
			r.Get("/bookings/{bookingID}", routes.Public.BookingGet)
			r.Delete("/bookings/{bookingID}", routes.Public.BookingCancel)
		})
	})

	return r
}
