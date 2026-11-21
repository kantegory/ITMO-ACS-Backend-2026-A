package routes

import (
	"property-service/internal/client"
	"property-service/internal/config"
	"property-service/internal/handlers"
	"property-service/internal/middleware"
	"property-service/internal/repositories"
	"property-service/internal/services"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine, cfg *config.Config, authClient *client.AuthClient, outboxRepo *repositories.OutboxRepository) {
	propertyRepo := repositories.NewPropertyRepository()
	propertyService := services.NewPropertyService(propertyRepo, authClient)

	propertyHandler := handlers.NewPropertyHandler(cfg, authClient)
	propertyTypeHandler := handlers.NewPropertyTypeHandler(cfg)
	amenityHandler := handlers.NewAmenityHandler(cfg)
	imageHandler := handlers.NewImageHandler(cfg, authClient)
	internalHandler := handlers.NewInternalHandler(cfg, propertyService)

	api := router.Group("/api/v1")

	api.GET("/properties", propertyHandler.List)
	api.GET("/properties/:id", propertyHandler.Get)

	protected := api.Group("/")
	protected.Use(middleware.AuthMiddleware(cfg))
	{
		protected.POST("/properties", middleware.RoleMiddleware("owner", "admin"), propertyHandler.Create)
		protected.PUT("/properties/:id", middleware.RoleMiddleware("owner", "admin"), propertyHandler.Update)
		protected.DELETE("/properties/:id", middleware.RoleMiddleware("owner", "admin"), propertyHandler.Delete)
		protected.PATCH("/properties/:id/status", middleware.RoleMiddleware("owner", "admin"), propertyHandler.UpdateStatus)

		protected.GET("/property-types", propertyTypeHandler.List)
		protected.POST("/property-types", middleware.RoleMiddleware("admin"), propertyTypeHandler.Create)

		protected.GET("/amenities", amenityHandler.List)
		protected.POST("/amenities", middleware.RoleMiddleware("admin"), amenityHandler.Create)
		protected.DELETE("/amenities/:id", middleware.RoleMiddleware("admin"), amenityHandler.Delete)

		protected.POST("/properties/:id/images", middleware.RoleMiddleware("owner", "admin"), imageHandler.Upload)
		protected.GET("/properties/:id/images", imageHandler.List)
		protected.DELETE("/property-images/:imageId", middleware.RoleMiddleware("owner", "admin"), imageHandler.Delete)
		protected.PATCH("/property-images/:imageId", middleware.RoleMiddleware("owner", "admin"), imageHandler.SetMain)
	}

	internal := router.Group("/internal")
	internal.Use(middleware.ServiceTokenMiddleware(cfg))
	{
		internal.GET("/properties/:id", internalHandler.GetPropertyByID)
		internal.POST("/properties/batch", internalHandler.GetPropertiesBatch)
		internal.GET("/properties/:id/owner", internalHandler.CheckOwner)
	}
}