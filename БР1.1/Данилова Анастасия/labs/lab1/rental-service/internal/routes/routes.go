package routes

import (
	"rental-service/internal/handlers"
	"rental-service/internal/middleware"
	"rental-service/internal/repository"
	"rental-service/internal/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetupRoutes(r *gin.Engine, db *gorm.DB, jwtSecret string) {
	h := handlers.NewHandler(db)

	userRepo := &repository.UserRepository{DB: db}
	authService := &services.AuthService{UserRepo: userRepo}
	authHandler := &handlers.AuthHandler{Service: authService}

	r.Use(func(c *gin.Context) {
		// make secret available for handlers that need it
		c.Set("jwt_secret", jwtSecret)
		c.Next()
	})

	r.POST("/auth/register", authHandler.Register)
	r.POST("/auth/login", authHandler.Login)

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "pong"})
	})

	// public properties endpoints (list/details)
	r.GET("/properties", h.ListProperties)
	r.GET("/properties/:id", h.GetPropertyByID)

	// protected group
	auth := r.Group("/")
	auth.Use(middleware.JWTAuth(jwtSecret))
	{
		auth.GET("/me", h.GetMe)
		auth.GET("/me/properties", h.ListMyProperties)
		auth.GET("/me/rentals", h.ListMyRentals)

		auth.POST("/properties", h.CreateProperty)
		auth.PATCH("/properties/:id", h.UpdateProperty)
		auth.DELETE("/properties/:id", h.DeleteProperty)

		auth.POST("/properties/:id/chats", h.StartChatByProperty)
		auth.GET("/chats", h.ListMyChats)
		auth.GET("/chats/:id/messages", h.ListMessages)
		auth.POST("/chats/:id/messages", h.SendMessage)
	}
}
