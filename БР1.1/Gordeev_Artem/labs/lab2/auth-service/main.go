package main

import (
	"log"

	"auth-service/internal/config"
	"auth-service/internal/database"
	"auth-service/internal/routes"
)

func main() {
	cfg := config.LoadConfig()
	database.InitDB(cfg)

	r := routes.SetupRouter(cfg)

	log.Printf("Auth Service starting on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}
