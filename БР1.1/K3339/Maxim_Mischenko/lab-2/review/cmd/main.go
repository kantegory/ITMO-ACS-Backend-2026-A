package main

import (
	"review/internal/handler"
	"review/internal/repository"
	"log"
	"net/http"
	"os"

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
	h := handler.NewReviewHandler(repo)

	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Heartbeat("/ping"))

	r.Route("/api/v1", func (r chi.Router)  {
		r.Get("/catalog/restaurants/{id}/reviews", h.GetByRestaurant)
		r.Post("/reviews", h.Create)
	})

	log.Println("Review Service starting on :8004...")
	http.ListenAndServe(":8004", r)
}
