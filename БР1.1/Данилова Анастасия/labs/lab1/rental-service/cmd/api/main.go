package main

import (
	"log"
	"rental-service/internal/config"
	"rental-service/internal/database"
	"rental-service/internal/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	db := database.Connect()

	r := gin.Default()

	cfg := config.Load()
	routes.SetupRoutes(r, db, cfg.JWTSecret)

	err := r.Run(":" + cfg.Port)
	if err != nil {
		log.Fatal(err)
	}
}
