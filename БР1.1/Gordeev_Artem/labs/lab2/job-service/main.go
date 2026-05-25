package main

import (
	"log"

	"job-service/internal/config"
	"job-service/internal/database"
	"job-service/internal/kafka"
	"job-service/internal/routes"
)

func main() {
	cfg := config.LoadConfig()
	database.InitDB(cfg)

	kafka.InitKafka()
	defer kafka.Close()

	r := routes.SetupRouter(cfg)

	log.Printf("Job Service starting on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}
