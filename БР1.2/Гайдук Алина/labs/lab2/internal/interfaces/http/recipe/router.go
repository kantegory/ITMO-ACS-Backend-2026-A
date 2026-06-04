package recipe

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"

	"recipehub/internal/api"
	"recipehub/internal/config"
	"recipehub/internal/infrastructure/middleware"
	recipeusecase "recipehub/internal/usecase/recipe"
)

// NewRouter wires recipe public and internal HTTP routes.
func NewRouter(cfg config.ServiceConfig, service *recipeusecase.Service) http.Handler {
	router := chi.NewRouter()
	router.Use(chimw.RequestID)
	router.Use(middleware.Recovery)

	handler := NewHandler(service)
	authMw := &middleware.Auth{AccessSecret: cfg.JWTAccessSecret}
	serviceTokenMw := middleware.ServiceToken{Token: cfg.ServiceToken}

	router.Get("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		api.RespondJSON(w, http.StatusOK, map[string]any{
			"status":  "ok",
			"service": cfg.Name,
		})
	})

	router.Route("/api/v1", func(router chi.Router) {
		router.With(authMw.Optional).Get("/users/{id}/recipes", handler.ListByAuthor)
		router.With(authMw.Optional).Get("/recipes", handler.List)
		router.With(authMw.Required).Post("/recipes", handler.Create)
		router.With(authMw.Optional).Get("/recipes/{id}", handler.GetByID)
		router.With(authMw.Required).Patch("/recipes/{id}", handler.Patch)
		router.With(authMw.Required).Delete("/recipes/{id}", handler.Delete)
	})

	router.Route("/internal/v1", func(router chi.Router) {
		router.With(serviceTokenMw.Required).Get("/recipes/{id}/exists", handler.Exists)
		router.With(serviceTokenMw.Required).Get("/recipes/{id}/brief", handler.Brief)
		router.With(serviceTokenMw.Required).Get("/authors/{userId}/recipe-count", handler.AuthorRecipeCount)
	})

	return router
}
