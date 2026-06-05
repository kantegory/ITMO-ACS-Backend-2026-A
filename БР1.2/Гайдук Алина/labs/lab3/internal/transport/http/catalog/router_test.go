package catalog

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"recipehub/internal/config"
)

func TestRouterProtectsCatalogMutationsAndInternalRoutes(t *testing.T) {
	t.Parallel()

	router := NewRouter(config.ServiceConfig{
		Name:            "catalog-service",
		JWTAccessSecret: "test-secret",
		ServiceToken:    "service-token",
	}, nil)

	tests := []struct {
		name   string
		method string
		path   string
	}{
		{name: "create dish type", method: http.MethodPost, path: "/api/v1/dish-types"},
		{name: "create tag", method: http.MethodPost, path: "/api/v1/tags"},
		{name: "create ingredient", method: http.MethodPost, path: "/api/v1/ingredients"},
		{name: "validate ids", method: http.MethodPost, path: "/internal/v1/catalog/validate-ids"},
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
