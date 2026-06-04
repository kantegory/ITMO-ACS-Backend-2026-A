package gateway

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"recipehub/internal/config"
)

func TestRouterForwardsPublicRoutesToOwners(t *testing.T) {
	t.Parallel()

	identity := newTestUpstream(t, "identity")
	catalog := newTestUpstream(t, "catalog")
	recipe := newTestUpstream(t, "recipe")
	blog := newTestUpstream(t, "blog")
	engagement := newTestUpstream(t, "engagement")

	router := NewRouter(config.ServiceConfig{
		Name:          "gateway",
		IdentityURL:   identity.URL,
		CatalogURL:    catalog.URL,
		RecipeURL:     recipe.URL,
		BlogURL:       blog.URL,
		EngagementURL: engagement.URL,
	})

	tests := []struct {
		method string
		path   string
		want   string
	}{
		{method: http.MethodPost, path: "/api/v1/auth/register", want: "identity /api/v1/auth/register"},
		{method: http.MethodPost, path: "/api/v1/auth/login", want: "identity /api/v1/auth/login"},
		{method: http.MethodPost, path: "/api/v1/auth/refresh", want: "identity /api/v1/auth/refresh"},
		{method: http.MethodPatch, path: "/api/v1/users/me", want: "identity /api/v1/users/me"},
		{method: http.MethodGet, path: "/api/v1/users/7", want: "identity /api/v1/users/7"},
		{method: http.MethodGet, path: "/api/v1/users/7/followers", want: "identity /api/v1/users/7/followers"},
		{method: http.MethodGet, path: "/api/v1/users/7/following", want: "identity /api/v1/users/7/following"},
		{method: http.MethodPost, path: "/api/v1/users/7/follow", want: "identity /api/v1/users/7/follow"},
		{method: http.MethodDelete, path: "/api/v1/users/7/follow", want: "identity /api/v1/users/7/follow"},

		{method: http.MethodGet, path: "/api/v1/dish-types", want: "catalog /api/v1/dish-types"},
		{method: http.MethodPost, path: "/api/v1/dish-types", want: "catalog /api/v1/dish-types"},
		{method: http.MethodGet, path: "/api/v1/difficulties", want: "catalog /api/v1/difficulties"},
		{method: http.MethodGet, path: "/api/v1/tags", want: "catalog /api/v1/tags"},
		{method: http.MethodPost, path: "/api/v1/tags", want: "catalog /api/v1/tags"},
		{method: http.MethodGet, path: "/api/v1/ingredients", want: "catalog /api/v1/ingredients"},
		{method: http.MethodPost, path: "/api/v1/ingredients", want: "catalog /api/v1/ingredients"},

		{method: http.MethodGet, path: "/api/v1/users/7/recipes", want: "recipe /api/v1/users/7/recipes"},
		{method: http.MethodGet, path: "/api/v1/recipes", want: "recipe /api/v1/recipes"},
		{method: http.MethodPost, path: "/api/v1/recipes", want: "recipe /api/v1/recipes"},
		{method: http.MethodGet, path: "/api/v1/recipes/11", want: "recipe /api/v1/recipes/11"},
		{method: http.MethodPatch, path: "/api/v1/recipes/11", want: "recipe /api/v1/recipes/11"},
		{method: http.MethodDelete, path: "/api/v1/recipes/11", want: "recipe /api/v1/recipes/11"},

		{method: http.MethodGet, path: "/api/v1/users/7/posts", want: "blog /api/v1/users/7/posts"},
		{method: http.MethodGet, path: "/api/v1/posts", want: "blog /api/v1/posts"},
		{method: http.MethodPost, path: "/api/v1/posts", want: "blog /api/v1/posts"},
		{method: http.MethodGet, path: "/api/v1/posts/12", want: "blog /api/v1/posts/12"},
		{method: http.MethodPatch, path: "/api/v1/posts/12", want: "blog /api/v1/posts/12"},
		{method: http.MethodDelete, path: "/api/v1/posts/12", want: "blog /api/v1/posts/12"},

		{method: http.MethodGet, path: "/api/v1/recipes/11/comments", want: "engagement /api/v1/recipes/11/comments"},
		{method: http.MethodPost, path: "/api/v1/recipes/11/comments", want: "engagement /api/v1/recipes/11/comments"},
		{method: http.MethodPost, path: "/api/v1/recipes/11/like", want: "engagement /api/v1/recipes/11/like"},
		{method: http.MethodDelete, path: "/api/v1/recipes/11/like", want: "engagement /api/v1/recipes/11/like"},
		{method: http.MethodPost, path: "/api/v1/recipes/11/save", want: "engagement /api/v1/recipes/11/save"},
		{method: http.MethodDelete, path: "/api/v1/recipes/11/save", want: "engagement /api/v1/recipes/11/save"},
		{method: http.MethodGet, path: "/api/v1/users/me/saved", want: "engagement /api/v1/users/me/saved"},
		{method: http.MethodGet, path: "/api/v1/posts/12/comments", want: "engagement /api/v1/posts/12/comments"},
		{method: http.MethodPost, path: "/api/v1/posts/12/comments", want: "engagement /api/v1/posts/12/comments"},
		{method: http.MethodPost, path: "/api/v1/posts/12/like", want: "engagement /api/v1/posts/12/like"},
		{method: http.MethodDelete, path: "/api/v1/posts/12/like", want: "engagement /api/v1/posts/12/like"},
		{method: http.MethodDelete, path: "/api/v1/comments/3", want: "engagement /api/v1/comments/3"},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.path, func(t *testing.T) {
			t.Parallel()

			req := httptest.NewRequest(tt.method, tt.path, nil)
			rr := httptest.NewRecorder()
			router.ServeHTTP(rr, req)

			if rr.Code != http.StatusOK {
				t.Fatalf("status = %d, want %d; body = %s", rr.Code, http.StatusOK, rr.Body.String())
			}
			if got := strings.TrimSpace(rr.Body.String()); got != tt.want {
				t.Fatalf("body = %q, want %q", got, tt.want)
			}
		})
	}
}

func newTestUpstream(t *testing.T, name string) *httptest.Server {
	t.Helper()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = fmt.Fprintf(w, "%s %s", name, r.URL.Path)
	}))
	t.Cleanup(server.Close)

	return server
}
