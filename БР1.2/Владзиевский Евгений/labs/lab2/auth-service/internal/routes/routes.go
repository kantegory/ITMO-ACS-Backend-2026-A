package routes

import (
	"auth-service/internal/config"
	"auth-service/internal/handlers"
	"auth-service/internal/middleware"
	"auth-service/internal/repositories"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine, cfg *config.Config, outboxRepo *repositories.OutboxRepository) {
	authHandler := handlers.NewAuthHandler(cfg, outboxRepo)
	userHandler := handlers.NewUserHandler(cfg, outboxRepo)
	internalHandler := handlers.NewInternalHandler(cfg, outboxRepo)

	api := router.Group("/api/v1")

	api.POST("/auth/register", authHandler.Register)
	api.POST("/auth/login", authHandler.Login)

	protected := api.Group("/")
	protected.Use(middleware.AuthMiddleware(cfg))
	{
		protected.GET("/users/me", userHandler.GetMe)
		protected.PUT("/users/me", userHandler.UpdateMe)
		protected.PATCH("/users/:id/role", middleware.RoleMiddleware("admin"), userHandler.ChangeRole)
	}

	internal := router.Group("/internal")
	internal.Use(middleware.ServiceTokenMiddleware(cfg))
	{
		internal.POST("/auth/validate", internalHandler.ValidateToken)
		internal.GET("/users/:id", internalHandler.GetUserByID)
		internal.POST("/users/batch", internalHandler.GetUsersBatch)
		internal.GET("/users/:id/role", internalHandler.GetUserRole)
	}
}