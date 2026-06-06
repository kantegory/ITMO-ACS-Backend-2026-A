// @title           Rental API
// @version         1.0
// @description     REST API для сервиса аренды недвижимости
// @host            localhost:8080
// @BasePath        /api/v1
// @securityDefinitions.apikey BearerAuth
// @in              header
// @name            Authorization
// @description     Введите токен в формате: Bearer {token}
package main

import (
	"database/sql"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	_ "github.com/ZZISST/rental-api/docs"
	"github.com/ZZISST/rental-api/internal/config"
	"github.com/ZZISST/rental-api/internal/handler"
	"github.com/ZZISST/rental-api/internal/middleware"
	"github.com/ZZISST/rental-api/internal/repository"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	db, err := sql.Open("postgres", cfg.DSN())
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("failed to ping database: %v", err)
	}
	log.Println("connected to database")

	// Repositories
	userRepo := repository.NewUserRepository(db)
	propertyRepo := repository.NewPropertyRepository(db)
	bookingRepo := repository.NewBookingRepository(db)
	chatRepo := repository.NewChatRepository(db)
	favoriteRepo := repository.NewFavoriteRepository(db)
	reviewRepo := repository.NewReviewRepository(db)

	// Handlers
	authHandler := handler.NewAuthHandler(userRepo, cfg.JWTSecret)
	propertyHandler := handler.NewPropertyHandler(propertyRepo)
	bookingHandler := handler.NewBookingHandler(bookingRepo, propertyRepo)
	chatHandler := handler.NewChatHandler(chatRepo)
	favoriteHandler := handler.NewFavoriteHandler(favoriteRepo, propertyRepo)
	reviewHandler := handler.NewReviewHandler(reviewRepo, bookingRepo)

	r := gin.Default()

	// Swagger UI
	r.GET("/swagger", func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/swagger/index.html")
	})
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Health check
	r.GET("/health", func(c *gin.Context) {
		if err := db.Ping(); err != nil {
			c.JSON(500, gin.H{"status": "unhealthy", "error": err.Error()})
			return
		}
		c.JSON(200, gin.H{"status": "ok"})
	})

	api := r.Group("/api/v1")
	{
		// Auth (public)
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
		}

		// Properties (public read)
		api.GET("/properties", propertyHandler.List)
		api.GET("/properties/:propertyId", propertyHandler.GetByID)

		// Protected routes
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware(cfg.JWTSecret))
		{
			// User
			protected.GET("/users/me", authHandler.Me)

			// Properties (owner)
			protected.POST("/properties", propertyHandler.Create)
			protected.PATCH("/properties/:propertyId", propertyHandler.Update)
			protected.DELETE("/properties/:propertyId", propertyHandler.Delete)
			protected.GET("/users/me/properties", propertyHandler.ListMyProperties)

			// Bookings
			protected.POST("/bookings", bookingHandler.Create)
			protected.GET("/bookings", bookingHandler.List)
			protected.GET("/bookings/:bookingId", bookingHandler.GetByID)
			protected.PATCH("/bookings/:bookingId", bookingHandler.UpdateStatus)
			protected.GET("/users/me/owner/bookings", bookingHandler.ListOwnerBookings)

			// Chats
			protected.GET("/chats", chatHandler.ListChats)
			protected.GET("/chats/:chatId/messages", chatHandler.GetMessages)
			protected.POST("/chats/:chatId/messages", chatHandler.SendMessage)

			// Favorites
			protected.GET("/favorites", favoriteHandler.List)
			protected.POST("/favorites/:propertyId", favoriteHandler.Add)
			protected.DELETE("/favorites/:propertyId", favoriteHandler.Remove)

			// Reviews
			protected.POST("/reviews", reviewHandler.Create)
		}
	}

	log.Printf("starting server on %s", cfg.WebPort)
	if err := r.Run(cfg.WebPort); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}
