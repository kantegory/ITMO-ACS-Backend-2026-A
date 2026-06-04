package identity

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"recipehub/internal/config"
)

func TestRouterProtectsIdentityPrivateAndInternalRoutes(t *testing.T) {
	t.Parallel()

	router := NewRouter(config.ServiceConfig{
		Name:            "identity-service",
		JWTAccessSecret: "test-secret",
		ServiceToken:    "service-token",
	}, nil)

	tests := []struct {
		name   string
		method string
		path   string
	}{
		{name: "patch me", method: http.MethodPatch, path: "/api/v1/users/me"},
		{name: "follow", method: http.MethodPost, path: "/api/v1/users/7/follow"},
		{name: "unfollow", method: http.MethodDelete, path: "/api/v1/users/7/follow"},
		{name: "user exists", method: http.MethodGet, path: "/internal/v1/users/7/exists"},
		{name: "user short", method: http.MethodGet, path: "/internal/v1/users/7"},
		{name: "users batch", method: http.MethodPost, path: "/internal/v1/users/batch"},
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
