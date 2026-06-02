package main

import (
	"api-gateway/internal/config"
	"api-gateway/internal/middleware"
	"api-gateway/internal/routes"
	"log"
	"strconv"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("Failed to load config:", err)
	}

	if cfg.ServerPort != 8080 {
		log.Printf("INFO: API Gateway typically runs on port 8080, got %d", cfg.ServerPort)
	}

	gin.SetMode(gin.ReleaseMode)
	router := gin.New()
	router.Use(middleware.LoggingMiddleware())
	router.Use(gin.Recovery())

	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"service": "api-gateway",
		})
	})

	routes.SetupRoutes(router, cfg)

	addr := cfg.ServerHost + ":" + strconv.Itoa(cfg.ServerPort)
	log.Printf("API Gateway starting on %s", addr)
	log.Printf("Routing to: auth=%s, property=%s, booking=%s, payment=%s, messaging=%s",
		cfg.AuthServiceURL, cfg.PropertyServiceURL, cfg.BookingServiceURL, cfg.PaymentServiceURL, cfg.MessagingServiceURL)

	if err := router.Run(addr); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}