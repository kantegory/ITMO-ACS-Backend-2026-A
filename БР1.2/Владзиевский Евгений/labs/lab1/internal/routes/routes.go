package routes

import (
	"rental-api/internal/config"
	"rental-api/internal/handlers"
	"rental-api/internal/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.RouterGroup, cfg *config.Config) {
	// Public routes
	authHandler := handlers.NewAuthHandler(cfg)
	router.POST("/auth/register", authHandler.Register)
	router.POST("/auth/login", authHandler.Login)

	// Protected routes (require authentication)
	protected := router.Group("/")
	protected.Use(middleware.AuthMiddleware(cfg))

	// User routes
	userHandler := handlers.NewUserHandler(cfg)
	protected.GET("/users/me", userHandler.GetMe)
	protected.PUT("/users/me", userHandler.UpdateMe)
	protected.PATCH("/users/:id/role", middleware.RoleMiddleware("admin"), userHandler.ChangeRole)

	// Property types routes
	propertyTypeHandler := handlers.NewPropertyTypeHandler(cfg)
	protected.GET("/property-types", propertyTypeHandler.List) // public actually, but we keep protected for now
	protected.POST("/property-types", middleware.RoleMiddleware("admin"), propertyTypeHandler.Create)

	// Amenities routes
	amenityHandler := handlers.NewAmenityHandler(cfg)
	protected.GET("/amenities", amenityHandler.List)
	protected.POST("/amenities", middleware.RoleMiddleware("admin"), amenityHandler.Create)
	protected.DELETE("/amenities/:id", middleware.RoleMiddleware("admin"), amenityHandler.Delete)

	// Properties routes
	propertyHandler := handlers.NewPropertyHandler(cfg)
	router.GET("/properties", propertyHandler.List) // public
	protected.POST("/properties", middleware.RoleMiddleware("owner", "admin"), propertyHandler.Create)
	protected.GET("/properties/:id", propertyHandler.Get)
	protected.PUT("/properties/:id", middleware.RoleMiddleware("owner", "admin"), propertyHandler.Update)
	protected.DELETE("/properties/:id", middleware.RoleMiddleware("owner", "admin"), propertyHandler.Delete)
	protected.PATCH("/properties/:id/status", middleware.RoleMiddleware("owner", "admin"), propertyHandler.UpdateStatus)

	// Property images routes
	imageHandler := handlers.NewImageHandler(cfg)
	protected.POST("/properties/:id/images", middleware.RoleMiddleware("owner", "admin"), imageHandler.Upload)
	protected.GET("/properties/:id/images", imageHandler.List)
	protected.DELETE("/property-images/:imageId", middleware.RoleMiddleware("owner", "admin"), imageHandler.Delete)
	protected.PATCH("/property-images/:imageId", middleware.RoleMiddleware("owner", "admin"), imageHandler.SetMain)

	// Rentals routes
	rentalHandler := handlers.NewRentalHandler(cfg)
	protected.GET("/rentals", rentalHandler.List)
	protected.POST("/rentals", middleware.RoleMiddleware("tenant"), rentalHandler.Create)
	protected.GET("/rentals/:id", rentalHandler.Get)
	protected.PATCH("/rentals/:id", rentalHandler.UpdateStatus)
	protected.POST("/rentals/:id/pay", middleware.RoleMiddleware("tenant"), rentalHandler.Pay)

	// Messages routes
	messageHandler := handlers.NewMessageHandler(cfg)
	protected.POST("/messages", messageHandler.Send)
	protected.GET("/messages/conversations", messageHandler.Conversations)
	protected.GET("/messages/property/:propertyId/user/:userId", messageHandler.History)

	// Transactions routes
	transactionHandler := handlers.NewTransactionHandler(cfg)
	protected.GET("/transactions", transactionHandler.List)
}
