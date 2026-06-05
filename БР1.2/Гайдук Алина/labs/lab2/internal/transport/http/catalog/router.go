package catalog

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"

	"recipehub/internal/config"
	"recipehub/internal/infrastructure/middleware"
	"recipehub/internal/transport/http/response"
	catalogusecase "recipehub/internal/usecase/catalog"
)

// NewRouter wires catalog public and internal HTTP routes.
func NewRouter(cfg config.ServiceConfig, service *catalogusecase.Service) http.Handler {
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
		router.Get("/dish-types", handler.ListDishTypes)
		router.With(authMw.Required).Post("/dish-types", handler.CreateDishType)
		router.Get("/difficulties", handler.ListDifficulties)
		router.Get("/tags", handler.ListTags)
		router.With(authMw.Required).Post("/tags", handler.CreateTag)
		router.Get("/ingredients", handler.ListIngredients)
		router.With(authMw.Required).Post("/ingredients", handler.CreateIngredient)
	})

	router.Route("/internal/v1", func(router chi.Router) {
		router.With(serviceTokenMw.Required).Post("/catalog/validate-ids", handler.ValidateIDs)
	})

	return router
}
