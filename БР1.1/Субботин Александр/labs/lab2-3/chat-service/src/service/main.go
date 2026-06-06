// @title           Chat Service API
// @version         1.0
// @description     Сервис чатов и сообщений
// @host            localhost:8084
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

	_ "github.com/ZZISST/rental-chat-service/docs"
	"github.com/ZZISST/rental-chat-service/internal/config"
	"github.com/ZZISST/rental-chat-service/internal/handler"
	"github.com/ZZISST/rental-chat-service/internal/middleware"
	"github.com/ZZISST/rental-chat-service/internal/repository"
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
	log.Println("chat-service: connected to database")

	chatRepo := repository.NewChatRepository(db)
	chatHandler := handler.NewChatHandler(chatRepo)

	r := gin.Default()

	r.GET("/swagger", func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/swagger/index.html")
	})
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	r.GET("/health", func(c *gin.Context) {
		if err := db.Ping(); err != nil {
			c.JSON(500, gin.H{"status": "unhealthy", "error": err.Error()})
			return
		}
		c.JSON(200, gin.H{"status": "ok", "service": "chat-service"})
	})

	api := r.Group("/api/v1")
	{
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware(cfg.JWTSecret))
		{
			protected.POST("/chats", chatHandler.CreateChat)
			protected.GET("/chats", chatHandler.ListChats)
			protected.GET("/chats/:chatId/messages", chatHandler.GetMessages)
			protected.POST("/chats/:chatId/messages", chatHandler.SendMessage)
		}
	}

	log.Printf("chat-service starting on %s", cfg.WebPort)
	if err := r.Run(cfg.WebPort); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}
