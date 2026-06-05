package middleware

import (
	"crypto/subtle"
	"net/http"
	"strings"

	"recipehub/internal/transport/http/response"
)

// ServiceToken protects internal service-to-service routes.
type ServiceToken struct {
	Token string
}

// Required rejects requests without a valid X-Service-Token header.
func (s ServiceToken) Required(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		got := strings.TrimSpace(r.Header.Get("X-Service-Token"))
		want := strings.TrimSpace(s.Token)
		if want == "" || subtle.ConstantTimeCompare([]byte(got), []byte(want)) != 1 {
			response.RespondError(w, http.StatusUnauthorized, "UNAUTHORIZED", "service token required")
			return
		}

		next.ServeHTTP(w, r)
	})
}
