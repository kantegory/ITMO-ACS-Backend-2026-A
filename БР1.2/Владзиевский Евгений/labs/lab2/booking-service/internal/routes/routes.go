package routes

import (
	"booking-service/internal/client"
	"booking-service/internal/config"
	"booking-service/internal/handlers"
	"booking-service/internal/middleware"
	"booking-service/internal/repositories"
	"booking-service/internal/services"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine, cfg *config.Config, outboxRepo *repositories.OutboxRepository) {
	rentalRepo := repositories.NewRentalRepository()
	authClient := client.NewAuthClient(cfg)
	propertyClient := client.NewPropertyClient(cfg)
	paymentClient := client.NewPaymentClient(cfg)

	rentalService := services.NewRentalService(rentalRepo, authClient, propertyClient, paymentClient, outboxRepo)
	rentalHandler := handlers.NewRentalHandler(rentalService, authClient, propertyClient)
	internalHandler := handlers.NewInternalHandler(rentalRepo)

	api := router.Group("/api/v1")
	rentals := api.Group("/rentals")
	rentals.Use(middleware.AuthMiddleware(authClient))
	{
		rentals.GET("", rentalHandler.List)
		rentals.POST("", rentalHandler.Create)
		rentals.GET("/:id", rentalHandler.Get)
		rentals.PATCH("/:id", rentalHandler.UpdateStatus)
		rentals.POST("/:id/pay", rentalHandler.Pay)
	}

	internal := router.Group("/internal")
	internal.Use(middleware.ServiceTokenMiddleware(cfg.ServiceToken))
	{
		internal.GET("/rentals/check", internalHandler.CheckRental)
		internal.GET("/rentals/:id", internalHandler.GetRentalByID)
		internal.PATCH("/rentals/:id/status", internalHandler.UpdateRentalStatus)
	}
}