package middleware

import (
"context"
"net/http"
"strings"

"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const UserClaimsKey = contextKey("user_claims")

type UserClaims struct {
UserID int    `json:"user_id"`
Email  string `json:"email"`
Role   string `json:"role"`
jwt.RegisteredClaims
}

func JWTMiddleware(secret string) func(http.Handler) http.Handler {
return func(next http.Handler) http.Handler {
return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
authHeader := r.Header.Get("Authorization")
if authHeader == "" {
http.Error(w, `{"error":"Authorization header is required"}`, http.StatusUnauthorized)
return
}

tokenString := strings.TrimPrefix(authHeader, "Bearer ")
if tokenString == authHeader {
http.Error(w, `{"error":"Invalid authorization format"}`, http.StatusUnauthorized)
return
}

claims := &UserClaims{}
token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
return []byte(secret), nil
})

if err != nil || !token.Valid {
http.Error(w, `{"error":"Invalid or expired token"}`, http.StatusUnauthorized)
return
}

ctx := context.WithValue(r.Context(), UserClaimsKey, claims)
next.ServeHTTP(w, r.WithContext(ctx))
})
}
}

func GetClaimsFromContext(ctx context.Context) (*UserClaims, bool) {
claims, ok := ctx.Value(UserClaimsKey).(*UserClaims)
return claims, ok
}
