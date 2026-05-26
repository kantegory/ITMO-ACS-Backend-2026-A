package main

import (
	"log"

	"profile-service/internal/config"
	"profile-service/internal/database"
	"profile-service/internal/routes"
)

func main() {
	cfg := config.LoadConfig()
	database.InitDB(cfg)

	r := routes.SetupRouter(cfg)

	log.Printf("Profile Service starting on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}
