package main

import (
	"log"
	"net/http"
	"os"
	"review/internal/client"
	"review/internal/handler"
	"review/internal/repository"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

func main() {
	db, err := sqlx.Connect("postgres", os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatalf("Failed to connect to Review DB: %v", err)
	}
	defer db.Close()

	catalogURL := os.Getenv("CATALOG_SERVICE_URL")
	repo := repository.NewReviewRepository(db, catalogURL)
	authCli := client.NewAuthClient(os.Getenv("AUTH_SERVICE_URL"))
	h := handler.NewReviewHandler(repo, authCli)

	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Heartbeat("/ping"))

	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/restaurants/{id}/reviews", h.GetByRestaurant)
		r.Post("/reviews", h.Create)
	})

	log.Println("Review Service starting on :8004...")
	http.ListenAndServe(":8004", r)
}
