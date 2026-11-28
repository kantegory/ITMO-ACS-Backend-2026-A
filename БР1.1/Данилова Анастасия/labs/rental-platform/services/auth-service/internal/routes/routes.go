package routes

import (
	"rental-platform/services/auth-service/internal/handlers"
	sharedmw "rental-platform/shared/middleware"

	"github.com/gin-gonic/gin"
)

func Setup(r *gin.Engine, h *handlers.AuthHandler, jwtSecret string) {
	r.GET("/health", h.Health)

	r.POST("/auth/register", h.Register)
	r.POST("/auth/login", h.Login)
	r.POST("/auth/refresh", h.Refresh)

	auth := r.Group("/")
	auth.Use(sharedmw.JWTAuth(jwtSecret))
	{
		auth.POST("/auth/logout", h.Logout)
		auth.GET("/users/me", h.GetMe)
		auth.PATCH("/users/me", h.UpdateMe)
		auth.DELETE("/users/me", h.DeleteMe)
		auth.PUT("/users/change-password", h.ChangePassword)
		auth.GET("/users", h.ListUsers)
		auth.GET("/users/:user_id", h.GetUser)
	}

	r.GET("/internal/users/:user_id", h.GetInternalUser)
	r.POST("/internal/users/validate", h.ValidateUsers)
}
