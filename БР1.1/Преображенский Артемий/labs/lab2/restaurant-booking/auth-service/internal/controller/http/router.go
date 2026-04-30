package http

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"

	"restaurant-booking/auth-service/pkg/jwt"
	appmiddleware "restaurant-booking/auth-service/pkg/middleware"
)

type PublicRoutes struct {
	Register http.HandlerFunc
	Login    http.HandlerFunc
	Profile  http.HandlerFunc
}

type InternalRoutes struct {
	UserGet http.HandlerFunc
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

	r.Route("/api/auth", func(r chi.Router) {
		r.Post("/register", routes.Public.Register)
		r.Post("/login", routes.Public.Login)
		r.With(auth).Get("/me", routes.Public.Profile)
	})

	r.Route("/internal", func(r chi.Router) {
		r.Get("/users/{id}", routes.Internal.UserGet)
	})

	return r
}
