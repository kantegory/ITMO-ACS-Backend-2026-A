package middleware

import (
	"context"
	"net/http"

	"github.com/google/uuid"

	"restaurant-booking/pkg/jwt"
	"restaurant-booking/pkg/render"
)

type ctxKey int

const userIDKey ctxKey = 1

func Auth(cfg jwt.Config) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			h := r.Header.Get("Authorization")
			if len(h) < 8 || h[:7] != "Bearer " {
				render.WriteError(w, http.StatusUnauthorized)
				return
			}
			raw := h[7:]
			uid, err := jwt.ParseUserID(cfg, raw)
			if err != nil {
				render.WriteError(w, http.StatusUnauthorized)
				return
			}
			ctx := context.WithValue(r.Context(), userIDKey, uid)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func UserID(ctx context.Context) (uuid.UUID, bool) {
	v := ctx.Value(userIDKey)
	if v == nil {
		return uuid.Nil, false
	}
	id, ok := v.(uuid.UUID)
	return id, ok
}
