package middleware

import (
	"net/http"
	"strings"

	"rental-platform/shared/jwt"

	"github.com/gin-gonic/gin"
)

func JWTAuth(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		auth := c.GetHeader("Authorization")
		if auth == "" || !strings.HasPrefix(auth, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "missing bearer token"})
			c.Abort()
			return
		}

		raw := strings.TrimPrefix(auth, "Bearer ")
		claims, err := jwt.ParseAccessToken(raw, secret)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "invalid token"})
			c.Abort()
			return
		}

		c.Set(jwt.ContextUserIDKey, claims.UserID)
		c.Set(jwt.ContextUserRole, string(claims.Role))
		c.Next()
	}
}

func UserID(c *gin.Context) (uint, bool) {
	v, ok := c.Get(jwt.ContextUserIDKey)
	if !ok {
		return 0, false
	}
	id, ok := v.(uint)
	return id, ok
}
