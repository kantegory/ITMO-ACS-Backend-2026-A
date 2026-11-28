package middleware

import (
	"net/http"
	"strings"

	"rental-service/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

const (
	ContextUserIDKey = "user_id"
	ContextUserRole  = "user_role"
)

func JWTAuth(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		auth := c.GetHeader("Authorization")
		if auth == "" || !strings.HasPrefix(auth, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "missing bearer token"})
			c.Abort()
			return
		}

		raw := strings.TrimPrefix(auth, "Bearer ")
		token, err := jwt.ParseWithClaims(raw, &services.TokenClaims{}, func(token *jwt.Token) (interface{}, error) {
			return []byte(jwtSecret), nil
		})
		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "invalid token"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(*services.TokenClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "invalid token claims"})
			c.Abort()
			return
		}

		c.Set(ContextUserIDKey, claims.UserID)
		c.Set(ContextUserRole, claims.Role)
		c.Next()
	}
}

