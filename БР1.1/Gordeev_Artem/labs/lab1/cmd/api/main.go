package main

import (
	"log"

	"jobboard/internal/config"
	"jobboard/internal/database"
	"jobboard/internal/routes"
)

func main() {
	cfg := config.LoadConfig()

	database.InitDB(cfg)

	r := routes.SetupRouter(cfg)

	log.Printf("Starting server on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}
