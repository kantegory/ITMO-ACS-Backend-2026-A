package engagement

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"

	"recipehub/internal/api"
	"recipehub/internal/config"
	"recipehub/internal/infrastructure/middleware"
	engagementusecase "recipehub/internal/usecase/engagement"
)

// NewRouter wires engagement public and internal HTTP routes.
func NewRouter(cfg config.ServiceConfig, service *engagementusecase.Service) http.Handler {
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
		router.Get("/recipes/{id}/comments", handler.ListRecipeComments)
		router.With(authMw.Required).Post("/recipes/{id}/comments", handler.CreateRecipeComment)
		router.With(authMw.Required).Post("/recipes/{id}/like", handler.RecipeLike)
		router.With(authMw.Required).Delete("/recipes/{id}/like", handler.RecipeUnlike)
		router.With(authMw.Required).Post("/recipes/{id}/save", handler.SaveRecipe)
		router.With(authMw.Required).Delete("/recipes/{id}/save", handler.UnsaveRecipe)
		router.With(authMw.Required).Get("/users/me/saved", handler.ListSavedRecipes)

		router.Get("/posts/{id}/comments", handler.ListPostComments)
		router.With(authMw.Required).Post("/posts/{id}/comments", handler.CreatePostComment)
		router.With(authMw.Required).Post("/posts/{id}/like", handler.PostLike)
		router.With(authMw.Required).Delete("/posts/{id}/like", handler.PostUnlike)

		router.With(authMw.Required).Delete("/comments/{id}", handler.DeleteComment)
	})

	router.Route("/internal/v1", func(router chi.Router) {
		router.With(serviceTokenMw.Required).Post("/stats/recipes/batch", handler.RecipeStatsBatch)
		router.With(serviceTokenMw.Required).Post("/stats/posts/batch", handler.PostStatsBatch)
	})

	return router
}
