package gateway

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"

	"recipehub/internal/config"
	"recipehub/internal/infrastructure/middleware"
	"recipehub/internal/transport/http/response"
)

// NewRouter exposes the public API and forwards each route to its owning service.
func NewRouter(cfg config.ServiceConfig) http.Handler {
	router := chi.NewRouter()
	router.Use(chimw.RequestID)
	router.Use(middleware.Recovery)

	identity := newReverseProxy("identity-service", cfg.IdentityURL)
	catalog := newReverseProxy("catalog-service", cfg.CatalogURL)
	recipe := newReverseProxy("recipe-service", cfg.RecipeURL)
	blog := newReverseProxy("blog-service", cfg.BlogURL)
	engagement := newReverseProxy("engagement-service", cfg.EngagementURL)

	router.Get("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		response.RespondJSON(w, http.StatusOK, map[string]any{
			"status":  "ok",
			"service": cfg.Name,
		})
	})

	router.Route("/api/v1", func(router chi.Router) {
		router.Handle("/auth/*", identity)
		router.Handle("/users/me", identity)
		router.Handle("/users/{id}", identity)
		router.Handle("/users/{id}/followers", identity)
		router.Handle("/users/{id}/following", identity)
		router.Handle("/users/{id}/follow", identity)

		router.Handle("/users/{id}/recipes", recipe)
		router.Handle("/recipes", recipe)
		router.Handle("/recipes/{id}", recipe)

		router.Handle("/users/{id}/posts", blog)
		router.Handle("/posts", blog)
		router.Handle("/posts/{id}", blog)

		router.Handle("/dish-types", catalog)
		router.Handle("/difficulties", catalog)
		router.Handle("/tags", catalog)
		router.Handle("/ingredients", catalog)

		router.Handle("/recipes/{id}/comments", engagement)
		router.Handle("/recipes/{id}/like", engagement)
		router.Handle("/recipes/{id}/save", engagement)
		router.Handle("/users/me/saved", engagement)
		router.Handle("/posts/{id}/comments", engagement)
		router.Handle("/posts/{id}/like", engagement)
		router.Handle("/comments/{id}", engagement)
	})

	return router
}
