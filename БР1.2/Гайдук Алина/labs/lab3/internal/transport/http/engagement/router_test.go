package engagement

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"recipehub/internal/config"
)

func TestRouterProtectsEngagementMutationsAndInternalRoutes(t *testing.T) {
	t.Parallel()

	router := NewRouter(config.ServiceConfig{
		Name:            "engagement-service",
		JWTAccessSecret: "test-secret",
		ServiceToken:    "service-token",
	}, nil)

	tests := []struct {
		name   string
		method string
		path   string
	}{
		{name: "create recipe comment", method: http.MethodPost, path: "/api/v1/recipes/11/comments"},
		{name: "recipe like", method: http.MethodPost, path: "/api/v1/recipes/11/like"},
		{name: "recipe unlike", method: http.MethodDelete, path: "/api/v1/recipes/11/like"},
		{name: "save recipe", method: http.MethodPost, path: "/api/v1/recipes/11/save"},
		{name: "unsave recipe", method: http.MethodDelete, path: "/api/v1/recipes/11/save"},
		{name: "list saved recipes", method: http.MethodGet, path: "/api/v1/users/me/saved"},
		{name: "create post comment", method: http.MethodPost, path: "/api/v1/posts/12/comments"},
		{name: "post like", method: http.MethodPost, path: "/api/v1/posts/12/like"},
		{name: "post unlike", method: http.MethodDelete, path: "/api/v1/posts/12/like"},
		{name: "delete comment", method: http.MethodDelete, path: "/api/v1/comments/3"},
		{name: "recipe stats", method: http.MethodPost, path: "/internal/v1/stats/recipes/batch"},
		{name: "post stats", method: http.MethodPost, path: "/internal/v1/stats/posts/batch"},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			req := httptest.NewRequest(tt.method, tt.path, nil)
			rr := httptest.NewRecorder()
			router.ServeHTTP(rr, req)

			if rr.Code != http.StatusUnauthorized {
				t.Fatalf("status = %d, want %d; body = %s", rr.Code, http.StatusUnauthorized, rr.Body.String())
			}
		})
	}
}
