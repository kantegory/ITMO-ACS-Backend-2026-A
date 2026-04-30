package http

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"

	"restaurant-booking/catalog-service/pkg/jwt"
	appmiddleware "restaurant-booking/catalog-service/pkg/middleware"
)

type PublicRoutes struct {
	RestaurantList   http.HandlerFunc
	RestaurantGet    http.HandlerFunc
	RestaurantDelete http.HandlerFunc
	MenuList         http.HandlerFunc
	TableList        http.HandlerFunc
	ReviewList       http.HandlerFunc
	ReviewCreate     http.HandlerFunc
	ReviewGet        http.HandlerFunc
	ReviewUpdate     http.HandlerFunc
	ReviewDelete     http.HandlerFunc
}

type InternalRoutes struct {
	RestaurantGet http.HandlerFunc
	TableGet      http.HandlerFunc
}

type Routes struct {
	Public   PublicRoutes
	Internal InternalRoutes
	JWT      jwt.Config
}

func Router(routes Routes) http.Handler {
	r := chi.NewRouter()
	r.Use(appmiddleware.RequestLog)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.Timeout(60 * time.Second))

	auth := appmiddleware.Auth(routes.JWT)

	r.Route("/api/restaurants", func(r chi.Router) {
		r.Use(auth)
		r.Get("/", routes.Public.RestaurantList)
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", routes.Public.RestaurantGet)
			r.Delete("/", routes.Public.RestaurantDelete)
			r.Get("/menu", routes.Public.MenuList)
			r.Get("/tables", routes.Public.TableList)
			r.Get("/reviews", routes.Public.ReviewList)
			r.Post("/reviews", routes.Public.ReviewCreate)
			r.Get("/reviews/{reviewID}", routes.Public.ReviewGet)
			r.Put("/reviews/{reviewID}", routes.Public.ReviewUpdate)
			r.Delete("/reviews/{reviewID}", routes.Public.ReviewDelete)
		})
	})

	r.Route("/internal", func(r chi.Router) {
		r.Get("/restaurants/{id}", routes.Internal.RestaurantGet)
		r.Get("/restaurants/{restaurantID}/tables/{tableID}", routes.Internal.TableGet)
	})

	return r
}
