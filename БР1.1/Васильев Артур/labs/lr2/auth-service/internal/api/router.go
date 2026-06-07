package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	authhandler "auth-service/internal/api/handler/auth"
	internalhandler "auth-service/internal/api/handler/internalapi"
	"auth-service/internal/infrastructure/middleware"
)

type Handlers struct {
	Auth     *authhandler.Handler
	Internal *internalhandler.Handler
}

func NewRouter(h Handlers) http.Handler {
	r := chi.NewRouter()
	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(middleware.RequestContext)
	r.Use(middleware.Logger)
	r.Use(chimw.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	r.Get("/health", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"ok","service":"auth-service"}`))
	})

	r.Route("/api/v1/auth", func(r chi.Router) {
		r.Post("/register/candidate", h.Auth.RegisterCandidate)
		r.Post("/register/employer", h.Auth.RegisterEmployer)
		r.Post("/login", h.Auth.Login)
	})

	r.Get("/internal/v1/users/{id}", h.Internal.GetUser)

	return r
}
