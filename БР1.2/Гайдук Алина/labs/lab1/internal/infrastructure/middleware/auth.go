package middleware

import (
	"net/http"
	"strings"

	"recipehub/internal/api"
	"recipehub/internal/infrastructure/security/jwt"
	"recipehub/internal/pkg/authctx"
)

type Auth struct {
	AccessSecret string
}

func (a *Auth) Optional(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := r.Header.Get("Authorization")
		const p = "Bearer "
		if len(h) > len(p) && strings.EqualFold(h[:len(p)], p) {
			tok := strings.TrimSpace(h[len(p):])
			if id, err := jwt.ParseAccessToken(tok, a.AccessSecret); err == nil {
				r = r.WithContext(authctx.WithUserID(r.Context(), id))
			}
		}
		next.ServeHTTP(w, r)
	})
}

func (a *Auth) Required(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := r.Header.Get("Authorization")
		const p = "Bearer "
		if len(h) <= len(p) || !strings.EqualFold(h[:len(p)], p) {
			api.RespondError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Требуется авторизация")
			return
		}
		tok := strings.TrimSpace(h[len(p):])
		id, err := jwt.ParseAccessToken(tok, a.AccessSecret)
		if err != nil {
			api.RespondError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Требуется авторизация")
			return
		}
		next.ServeHTTP(w, r.WithContext(authctx.WithUserID(r.Context(), id)))
	})
}
