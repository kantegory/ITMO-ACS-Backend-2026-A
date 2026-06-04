// Структура HTTP-маршрутов по образцу официального примера chi "rest":
// https://github.com/go-chi/chi/blob/v5.2.1/_examples/rest/main.go
package httpserver

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"

	"recipehub/internal/api/deps"
	"recipehub/internal/api/handler/comments"
	"recipehub/internal/api/handler/likes"
	"recipehub/internal/api/handler/login"
	"recipehub/internal/api/handler/posts"
	"recipehub/internal/api/handler/recipes"
	"recipehub/internal/api/handler/refresh"
	"recipehub/internal/api/handler/refs"
	"recipehub/internal/api/handler/register"
	"recipehub/internal/api/handler/saved"
	"recipehub/internal/api/handler/users"
	"recipehub/internal/config"
	"recipehub/internal/infrastructure/database"
	"recipehub/internal/infrastructure/middleware"
)

func NewRouter(cfg config.Config, db *database.Store) http.Handler {
	r := chi.NewRouter()
	r.Use(chimw.RequestID)
	r.Use(middleware.Recovery)

	// Проверка живости для Docker и оркестраторов, не входит в OpenAPI.
	r.Get("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})

	mountSwagger(r)

	authMw := &middleware.Auth{AccessSecret: cfg.JWTAccessSecret}
	dep := deps.Deps{Store: db, Cfg: cfg}

	reg := register.New(dep)
	log := login.New(dep)
	refTok := refresh.New(dep)
	u := users.New(dep)
	rec := recipes.New(dep)
	pst := posts.New(dep)
	cmt := comments.New(dep)
	lk := likes.New(dep)
	sv := saved.New(dep)
	rf := refs.New(dep)

	r.Route("/api/v1", func(r chi.Router) {
		r.Post("/auth/register", reg.Post)
		r.Post("/auth/login", log.Post)
		r.Post("/auth/refresh", refTok.Post)

		r.With(authMw.Required).Patch("/users/me", u.PatchMe)
		r.With(authMw.Required).Get("/users/me/saved", sv.ListMe)

		r.Get("/users/{id}", u.GetByID)
		r.Get("/users/{id}/recipes", u.ListRecipes)
		r.Get("/users/{id}/posts", u.ListPosts)
		r.Get("/users/{id}/followers", u.ListFollowers)
		r.Get("/users/{id}/following", u.ListFollowing)
		r.With(authMw.Required).Post("/users/{id}/follow", u.Follow)
		r.With(authMw.Required).Delete("/users/{id}/follow", u.Unfollow)

		r.Get("/recipes", rec.List)
		r.With(authMw.Optional).Get("/recipes/{id}", rec.GetByID)
		r.With(authMw.Required).Post("/recipes", rec.Post)
		r.With(authMw.Required).Patch("/recipes/{id}", rec.Patch)
		r.With(authMw.Required).Delete("/recipes/{id}", rec.Delete)

		r.Get("/recipes/{id}/comments", cmt.ListForRecipe)
		r.With(authMw.Required).Post("/recipes/{id}/comments", cmt.PostForRecipe)
		r.With(authMw.Required).Post("/recipes/{id}/like", lk.RecipeLike)
		r.With(authMw.Required).Delete("/recipes/{id}/like", lk.RecipeUnlike)
		r.With(authMw.Required).Post("/recipes/{id}/save", sv.Save)
		r.With(authMw.Required).Delete("/recipes/{id}/save", sv.Unsave)

		r.Get("/posts", pst.List)
		r.With(authMw.Optional).Get("/posts/{id}", pst.GetByID)
		r.With(authMw.Required).Post("/posts", pst.Post)
		r.With(authMw.Required).Patch("/posts/{id}", pst.Patch)
		r.With(authMw.Required).Delete("/posts/{id}", pst.Delete)
		r.Get("/posts/{id}/comments", cmt.ListForPost)
		r.With(authMw.Required).Post("/posts/{id}/comments", cmt.PostForPost)
		r.With(authMw.Required).Post("/posts/{id}/like", lk.PostLike)
		r.With(authMw.Required).Delete("/posts/{id}/like", lk.PostUnlike)

		r.With(authMw.Required).Delete("/comments/{id}", cmt.DeleteByID)

		r.Get("/dish-types", rf.DishTypes)
		r.With(authMw.Required).Post("/dish-types", rf.PostDishType)
		r.Get("/difficulties", rf.Difficulties)
		r.Get("/tags", rf.Tags)
		r.With(authMw.Required).Post("/tags", rf.PostTag)
		r.Get("/ingredients", rf.Ingredients)
		r.With(authMw.Required).Post("/ingredients", rf.PostIngredient)
	})

	return r
}
