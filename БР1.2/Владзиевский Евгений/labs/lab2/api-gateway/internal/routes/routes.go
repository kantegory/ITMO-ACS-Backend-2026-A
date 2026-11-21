package routes

import (
	"api-gateway/internal/config"
	"api-gateway/internal/middleware"
	"api-gateway/internal/proxy"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine, cfg *config.Config) {
	api := router.Group("/api/v1")

	auth := api.Group("/auth")
	{
		auth.POST("/register", func(c *gin.Context) {
			proxy.ProxyRequest(cfg.AuthServiceURL, c)
		})
		auth.POST("/login", func(c *gin.Context) {
			proxy.ProxyRequest(cfg.AuthServiceURL, c)
		})
	}

	protected := api.Group("/")
	protected.Use(middleware.AuthMiddleware(cfg))
	{
		users := protected.Group("/users")
		{
			users.GET("/me", func(c *gin.Context) {
				proxy.ProxyRequest(cfg.AuthServiceURL, c)
			})
			users.PUT("/me", func(c *gin.Context) {
				proxy.ProxyRequest(cfg.AuthServiceURL, c)
			})
			users.PATCH("/:id/role", middleware.RoleMiddleware("admin"), func(c *gin.Context) {
				proxy.ProxyRequest(cfg.AuthServiceURL, c)
			})
		}

		propertyTypes := protected.Group("/property-types")
		{
			propertyTypes.GET("", func(c *gin.Context) {
				proxy.ProxyRequest(cfg.PropertyServiceURL, c)
			})
			propertyTypes.POST("", middleware.RoleMiddleware("admin"), func(c *gin.Context) {
				proxy.ProxyRequest(cfg.PropertyServiceURL, c)
			})
		}

		amenities := protected.Group("/amenities")
		{
			amenities.GET("", func(c *gin.Context) {
				proxy.ProxyRequest(cfg.PropertyServiceURL, c)
			})
			amenities.POST("", middleware.RoleMiddleware("admin"), func(c *gin.Context) {
				proxy.ProxyRequest(cfg.PropertyServiceURL, c)
			})
			amenities.DELETE("/:id", middleware.RoleMiddleware("admin"), func(c *gin.Context) {
				proxy.ProxyRequest(cfg.PropertyServiceURL, c)
			})
		}

		properties := api.Group("/properties")
		{
			properties.GET("", func(c *gin.Context) {
				proxy.ProxyRequest(cfg.PropertyServiceURL, c)
			})

			propAuth := properties.Group("/")
			propAuth.Use(middleware.AuthMiddleware(cfg))
			{
				propAuth.POST("", middleware.RoleMiddleware("owner", "admin"), func(c *gin.Context) {
					proxy.ProxyRequest(cfg.PropertyServiceURL, c)
				})
				propAuth.GET("/:id", func(c *gin.Context) {
					proxy.ProxyRequest(cfg.PropertyServiceURL, c)
				})
				propAuth.PUT("/:id", middleware.RoleMiddleware("owner", "admin"), func(c *gin.Context) {
					proxy.ProxyRequest(cfg.PropertyServiceURL, c)
				})
				propAuth.DELETE("/:id", middleware.RoleMiddleware("owner", "admin"), func(c *gin.Context) {
					proxy.ProxyRequest(cfg.PropertyServiceURL, c)
				})
				propAuth.PATCH("/:id/status", middleware.RoleMiddleware("owner", "admin"), func(c *gin.Context) {
					proxy.ProxyRequest(cfg.PropertyServiceURL, c)
				})
			}
		}

		propertyImages := protected.Group("/properties")
		{
			propertyImages.POST("/:id/images", middleware.RoleMiddleware("owner", "admin"), func(c *gin.Context) {
				proxy.ProxyMultipart(cfg.PropertyServiceURL, c)
			})
			propertyImages.GET("/:id/images", func(c *gin.Context) {
				proxy.ProxyRequest(cfg.PropertyServiceURL, c)
			})
			propertyImages.DELETE("/property-images/:imageId", middleware.RoleMiddleware("owner", "admin"), func(c *gin.Context) {
				proxy.ProxyRequest(cfg.PropertyServiceURL, c)
			})
			propertyImages.PATCH("/property-images/:imageId", middleware.RoleMiddleware("owner", "admin"), func(c *gin.Context) {
				proxy.ProxyRequest(cfg.PropertyServiceURL, c)
			})
		}

		rentals := protected.Group("/rentals")
		{
			rentals.GET("", func(c *gin.Context) {
				proxy.ProxyRequest(cfg.BookingServiceURL, c)
			})
			rentals.POST("", middleware.RoleMiddleware("tenant"), func(c *gin.Context) {
				proxy.ProxyRequest(cfg.BookingServiceURL, c)
			})
			rentals.GET("/:id", func(c *gin.Context) {
				proxy.ProxyRequest(cfg.BookingServiceURL, c)
			})
			rentals.PATCH("/:id", func(c *gin.Context) {
				proxy.ProxyRequest(cfg.BookingServiceURL, c)
			})
			rentals.POST("/:id/pay", middleware.RoleMiddleware("tenant"), func(c *gin.Context) {
				proxy.ProxyRequest(cfg.BookingServiceURL, c)
			})
		}

		messages := protected.Group("/messages")
		{
			messages.POST("", func(c *gin.Context) {
				proxy.ProxyRequest(cfg.MessagingServiceURL, c)
			})
			messages.GET("/conversations", func(c *gin.Context) {
				proxy.ProxyRequest(cfg.MessagingServiceURL, c)
			})
			messages.GET("/property/:propertyId/user/:userId", func(c *gin.Context) {
				proxy.ProxyRequest(cfg.MessagingServiceURL, c)
			})
		}

		protected.GET("/transactions", func(c *gin.Context) {
			proxy.ProxyRequest(cfg.PaymentServiceURL, c)
		})
	}
}