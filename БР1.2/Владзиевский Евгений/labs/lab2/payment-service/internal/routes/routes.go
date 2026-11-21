package routes

import (
	"payment-service/internal/config"
	"payment-service/internal/handlers"
	"payment-service/internal/middleware"
	"payment-service/internal/repositories"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine, cfg *config.Config, outboxRepo *repositories.OutboxRepository) {
	transactionHandler := handlers.NewTransactionHandler(cfg, outboxRepo)
	internalHandler := handlers.NewInternalHandler(cfg, outboxRepo)

	api := router.Group("/api/v1")
	api.Use(middleware.AuthMiddleware(cfg))
	{
		api.GET("/transactions", transactionHandler.List)
	}

	internal := router.Group("/internal")
	internal.Use(middleware.ServiceTokenMiddleware(cfg))
	{
		internal.POST("/payments", internalHandler.CreatePayment)
		internal.POST("/payments/:id/refund", internalHandler.CreateRefund)
		internal.GET("/transactions/rental/:rentalId", internalHandler.GetTransactionsByRental)
	}
}