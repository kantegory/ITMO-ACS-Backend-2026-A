package blog

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"

	"recipehub/internal/config"
	"recipehub/internal/infrastructure/middleware"
	"recipehub/internal/transport/http/response"
	blogusecase "recipehub/internal/usecase/blog"
)

// NewRouter wires blog public and internal HTTP routes.
func NewRouter(cfg config.ServiceConfig, service *blogusecase.Service) http.Handler {
	router := chi.NewRouter()
	router.Use(chimw.RequestID)
	router.Use(middleware.Recovery)

	handler := NewHandler(service)
	authMw := &middleware.Auth{AccessSecret: cfg.JWTAccessSecret}
	serviceTokenMw := middleware.ServiceToken{Token: cfg.ServiceToken}

	router.Get("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		response.RespondJSON(w, http.StatusOK, map[string]any{
			"status":  "ok",
			"service": cfg.Name,
		})
	})

	router.Route("/api/v1", func(router chi.Router) {
		router.With(authMw.Optional).Get("/users/{id}/posts", handler.ListByAuthor)
		router.With(authMw.Optional).Get("/posts", handler.List)
		router.With(authMw.Required).Post("/posts", handler.Create)
		router.With(authMw.Optional).Get("/posts/{id}", handler.GetByID)
		router.With(authMw.Required).Patch("/posts/{id}", handler.Patch)
		router.With(authMw.Required).Delete("/posts/{id}", handler.Delete)
	})

	router.Route("/internal/v1", func(router chi.Router) {
		router.With(serviceTokenMw.Required).Get("/posts/{id}/exists", handler.Exists)
		router.With(serviceTokenMw.Required).Get("/posts/{id}/brief", handler.Brief)
	})

	return router
}
