// @title Rental Property API
// @version 1.0
// @description This is a backend API for rental property management.
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.swagger.io/support
// @contact.email support@swagger.io

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html

// @host localhost:8080
// @BasePath /api/v1
// @schemes http

package main

import (
	"log"
	"os"
	"path/filepath"
	"rental-api/internal/config"
	"rental-api/internal/database"
	"rental-api/internal/middleware"
	"rental-api/internal/routes"
	"strconv"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("Failed to load config:", err)
	}

	// Connect to database
	err = database.Connect(cfg)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Run auto migration (optional, can be disabled in production)
	err = database.AutoMigrate()
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	// Create storage directory if not exists
	if err := ensureStorageDir(cfg.UploadDir); err != nil {
		log.Fatal("Failed to create storage directory:", err)
	}

	// Set Gin mode
	if cfg.LogLevel == "debug" {
		gin.SetMode(gin.DebugMode)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}

	// Create router
	router := gin.New()

	// Middleware
	router.Use(middleware.LoggingMiddleware())
	router.Use(gin.Recovery())

	// Swagger documentation
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler, ginSwagger.URL("/swagger.yaml")))
	router.GET("/swagger.yaml", func(c *gin.Context) {
		c.File(filepath.Join(".", "internal", "docs", "swagger.yaml"))
	})

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Setup routes
	api := router.Group("/api/v1")
	routes.SetupRoutes(api, cfg)

	// Start server
	addr := cfg.ServerHost + ":" + strconv.Itoa(cfg.ServerPort)
	log.Printf("Server starting on %s", addr)
	if err := router.Run(addr); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}

func ensureStorageDir(path string) error {
	if _, err := os.Stat(path); os.IsNotExist(err) {
		err := os.MkdirAll(path, 0755)
		if err != nil {
			return err
		}
	}
	return nil
}
