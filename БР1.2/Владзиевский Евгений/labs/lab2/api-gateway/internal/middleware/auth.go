package middleware

import (
	"api-gateway/internal/config"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type UserClaims struct {
	UserID float64 `json:"user_id"`
	Email  string  `json:"email"`
	Role   string  `json:"role"`
}

func AuthMiddleware(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": gin.H{"code": "UNAUTHORIZED", "message": "Authorization header required"},
			})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": gin.H{"code": "UNAUTHORIZED", "message": "Invalid authorization header format"},
			})
			c.Abort()
			return
		}

		claims, err := validateTokenLocally(tokenString, cfg.JWTSecret)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": gin.H{"code": "UNAUTHORIZED", "message": "Invalid or expired token"},
			})
			c.Abort()
			return
		}

		c.Set("user_id", uint(claims.UserID))
		c.Set("user_email", claims.Email)
		c.Set("user_role", claims.Role)
		c.Set("token", tokenString)
		c.Next()
	}
}

func OptionalAuthMiddleware(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.Next()
			return
		}

		claims, err := validateTokenLocally(tokenString, cfg.JWTSecret)
		if err == nil {
			c.Set("user_id", uint(claims.UserID))
			c.Set("user_email", claims.Email)
			c.Set("user_role", claims.Role)
			c.Set("token", tokenString)
		}
		c.Next()
	}
}

func RoleMiddleware(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("user_role")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": gin.H{"code": "UNAUTHORIZED", "message": "User role not found"},
			})
			c.Abort()
			return
		}

		roleStr, ok := userRole.(string)
		if !ok {
			c.JSON(http.StatusForbidden, gin.H{
				"error": gin.H{"code": "FORBIDDEN", "message": "Invalid role"},
			})
			c.Abort()
			return
		}

		for _, role := range roles {
			if roleStr == role {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, gin.H{
			"error": gin.H{"code": "FORBIDDEN", "message": "Insufficient permissions"},
		})
		c.Abort()
	}
}