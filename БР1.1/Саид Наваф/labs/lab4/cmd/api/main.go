package main

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/joho/godotenv"

	"job-search-api/internal/config"
	"job-search-api/internal/db"
	"job-search-api/internal/handler"
	"job-search-api/internal/repository"
)

func main() {

	if err := godotenv.Load(); err != nil {
		log.Println(" Warning: .env file not found, using system variables")
	}


	cfg := config.Load()


	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()


	pool, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf(" Database connection failed: %v", err)
	}
	defer pool.Close()
	log.Println(" Database connected successfully")


	if err := db.Migrate(ctx, pool); err != nil {
		log.Fatalf(" Migration failed: %v", err)
	}
	log.Println(" Migrations applied successfully")


	repos := repository.NewRepositories(pool)

	r := handler.NewRouter(repos, cfg.JWTSecret)


	addr := ":" + cfg.Port
	log.Printf(" Server starting on http://localhost%s", addr)

	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf(" Server failed: %v", err)
	}
}