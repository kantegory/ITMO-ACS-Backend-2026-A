package blog

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"recipehub/internal/config"
)

func TestRouterProtectsBlogMutationsAndInternalRoutes(t *testing.T) {
	t.Parallel()

	router := NewRouter(config.ServiceConfig{
		Name:            "blog-service",
		JWTAccessSecret: "test-secret",
		ServiceToken:    "service-token",
	}, nil)

	tests := []struct {
		name   string
		method string
		path   string
	}{
		{name: "create post", method: http.MethodPost, path: "/api/v1/posts"},
		{name: "patch post", method: http.MethodPatch, path: "/api/v1/posts/12"},
		{name: "delete post", method: http.MethodDelete, path: "/api/v1/posts/12"},
		{name: "post exists", method: http.MethodGet, path: "/internal/v1/posts/12/exists"},
		{name: "post brief", method: http.MethodGet, path: "/internal/v1/posts/12/brief"},
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
