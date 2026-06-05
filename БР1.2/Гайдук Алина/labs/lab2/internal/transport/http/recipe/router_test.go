package recipe

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"recipehub/internal/config"
)

func TestRouterProtectsRecipeMutationsAndInternalRoutes(t *testing.T) {
	t.Parallel()

	router := NewRouter(config.ServiceConfig{
		Name:            "recipe-service",
		JWTAccessSecret: "test-secret",
		ServiceToken:    "service-token",
	}, nil)

	tests := []struct {
		name   string
		method string
		path   string
	}{
		{name: "create recipe", method: http.MethodPost, path: "/api/v1/recipes"},
		{name: "patch recipe", method: http.MethodPatch, path: "/api/v1/recipes/11"},
		{name: "delete recipe", method: http.MethodDelete, path: "/api/v1/recipes/11"},
		{name: "recipe exists", method: http.MethodGet, path: "/internal/v1/recipes/11/exists"},
		{name: "recipe brief", method: http.MethodGet, path: "/internal/v1/recipes/11/brief"},
		{name: "recipe briefs batch", method: http.MethodPost, path: "/internal/v1/recipes/briefs/batch"},
		{name: "author recipe count", method: http.MethodGet, path: "/internal/v1/authors/7/recipe-count"},
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
