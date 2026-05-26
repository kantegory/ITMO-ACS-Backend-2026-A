package routes

import (
	"auth-service/internal/config"
	"auth-service/internal/handlers"

	"github.com/gin-gonic/gin"
)

func SetupRouter(cfg *config.Config) *gin.Engine {
	r := gin.Default()

	authHandler := handlers.NewAuthHandler(cfg)
	internalHandler := handlers.NewInternalHandler()

	internal := r.Group("/internal")
	internal.GET("/users/:id", internalHandler.GetUser)
	internal.POST("/users/batch", internalHandler.GetUsersBatch)

	v1 := r.Group("/v1")
	auth := v1.Group("/auth")
	auth.POST("/register", authHandler.Register)
	auth.POST("/login", authHandler.Login)
	auth.POST("/logout", authHandler.Logout)

	auth.GET("/me", authHandler.Me)
	auth.POST("/change-password", authHandler.ChangePassword)

	return r
}
