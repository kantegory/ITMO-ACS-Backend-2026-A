package main

import (
	"log"

	"resume-service/internal/config"
	"resume-service/internal/database"
	"resume-service/internal/routes"
)

func main() {
	cfg := config.LoadConfig()
	database.InitDB(cfg)

	r := routes.SetupRouter(cfg)

	log.Printf("Resume Service starting on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}
