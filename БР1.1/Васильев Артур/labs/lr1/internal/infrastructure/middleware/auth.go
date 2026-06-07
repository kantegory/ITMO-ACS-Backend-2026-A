package middleware

import (
	"context"
	"log/slog"
	"net/http"
	"strings"

	"github.com/google/uuid"

	"jobsearch/internal/domain"
	"jobsearch/internal/usecase/auth"
	"jobsearch/pkg/apperror"
	"jobsearch/pkg/httputil"
	"jobsearch/pkg/slogutil"
)

type ctxKey string

const (
	CtxUserID ctxKey = "userID"
	CtxRole   ctxKey = "role"
)

func Auth(tokens auth.TokenProvider) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			if header == "" || !strings.HasPrefix(header, "Bearer ") {
				slogutil.LogInfo(r.Context(), slogutil.LayerMiddleware, "auth", "missing bearer token",
					slog.String("path", r.URL.Path),
				)
				httputil.WriteError(w, apperror.Unauthorized("missing authorization header"))
				return
			}
			token := strings.TrimPrefix(header, "Bearer ")
			userID, role, err := tokens.Parse(token)
			if err != nil {
				slogutil.LogError(r.Context(), slogutil.LayerMiddleware, "auth", "token parse failed", err,
					slog.String("path", r.URL.Path),
				)
				httputil.WriteError(w, err)
				return
			}
			ctx := context.WithValue(r.Context(), CtxUserID, userID)
			ctx = context.WithValue(ctx, CtxRole, role)
			slogutil.LogDebug(ctx, slogutil.LayerMiddleware, "auth", "authenticated",
				slog.String("user_id", userID.String()),
				slog.String("role", string(role)),
			)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func RequireRole(role domain.Role) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			got, ok := r.Context().Value(CtxRole).(domain.Role)
			if !ok || got != role {
				slogutil.LogInfo(r.Context(), slogutil.LayerMiddleware, "auth", "forbidden role",
					slog.String("required", string(role)),
					slog.String("got", string(got)),
				)
				httputil.WriteError(w, apperror.Forbidden("insufficient permissions"))
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func UserID(ctx context.Context) uuid.UUID {
	id, _ := ctx.Value(CtxUserID).(uuid.UUID)
	return id
}
