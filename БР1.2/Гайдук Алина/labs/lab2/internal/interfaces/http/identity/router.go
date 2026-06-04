package identity

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"

	"recipehub/internal/api"
	"recipehub/internal/config"
	"recipehub/internal/infrastructure/middleware"
	identityusecase "recipehub/internal/usecase/identity"
)

// NewRouter wires identity public and internal HTTP routes.
func NewRouter(cfg config.ServiceConfig, service *identityusecase.Service) http.Handler {
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
		router.Post("/auth/register", handler.Register)
		router.Post("/auth/login", handler.Login)
		router.Post("/auth/refresh", handler.Refresh)

		router.With(authMw.Required).Patch("/users/me", handler.PatchMe)
		router.Get("/users/{id}", handler.GetByID)
		router.Get("/users/{id}/followers", handler.ListFollowers)
		router.Get("/users/{id}/following", handler.ListFollowing)
		router.With(authMw.Required).Post("/users/{id}/follow", handler.Follow)
		router.With(authMw.Required).Delete("/users/{id}/follow", handler.Unfollow)
	})

	router.Route("/internal/v1", func(router chi.Router) {
		router.With(serviceTokenMw.Required).Get("/users/{id}/exists", handler.UserExists)
		router.With(serviceTokenMw.Required).Get("/users/{id}", handler.UserShort)
		router.With(serviceTokenMw.Required).Post("/users/batch", handler.UsersBatch)
	})

	return router
}
