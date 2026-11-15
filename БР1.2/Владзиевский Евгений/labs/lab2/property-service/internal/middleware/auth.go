package middleware

import (
	"net/http"
	"property-service/internal/config"
	"property-service/internal/utils"
	"strings"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"code": "UNAUTHORIZED", "message": "Authorization header required"}})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"code": "UNAUTHORIZED", "message": "Invalid authorization header format"}})
			c.Abort()
			return
		}

		claims, err := utils.ValidateToken(tokenString, cfg.JWTSecret)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"code": "UNAUTHORIZED", "message": "Invalid or expired token"}})
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)
		c.Set("user_role", claims.Role)
		c.Next()
	}
}

func RoleMiddleware(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("user_role")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"code": "UNAUTHORIZED", "message": "User role not found"}})
			c.Abort()
			return
		}

		roleStr, ok := userRole.(string)
		if !ok {
			c.JSON(http.StatusForbidden, gin.H{"error": gin.H{"code": "FORBIDDEN", "message": "Invalid role"}})
			c.Abort()
			return
		}

		for _, role := range roles {
			if roleStr == role {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, gin.H{"error": gin.H{"code": "FORBIDDEN", "message": "Insufficient permissions"}})
		c.Abort()
	}
}

func ServiceTokenMiddleware(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.GetHeader("X-Service-Token")
		if token == "" {
			token = c.Query("service_token")
		}
		if token != cfg.ServiceToken {
			c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"code": "UNAUTHORIZED", "message": "Invalid service token"}})
			c.Abort()
			return
		}
		c.Next()
	}
}