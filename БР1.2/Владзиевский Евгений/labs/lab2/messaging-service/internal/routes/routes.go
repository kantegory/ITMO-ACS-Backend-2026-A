package routes

import (
	"messaging-service/internal/config"
	"messaging-service/internal/handlers"
	"messaging-service/internal/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine, cfg *config.Config) {
	messageHandler := handlers.NewMessageHandler(cfg)

	api := router.Group("/api/v1")
	protected := api.Group("/")
	protected.Use(middleware.AuthMiddleware(cfg))
	{
		protected.POST("/messages", messageHandler.Send)
		protected.GET("/messages/conversations", messageHandler.Conversations)
		protected.GET("/messages/property/:propertyId/user/:userId", messageHandler.History)
	}

	internal := router.Group("/internal")
	internal.Use(middleware.ServiceTokenMiddleware(cfg))
	{
		internal.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "ok", "service": "messaging"})
		})
	}
}