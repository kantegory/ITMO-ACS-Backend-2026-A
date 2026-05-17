package main

import (
	"catalog/internal/handler"
	"catalog/internal/repository"
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
		log.Fatalf("Failed to connect to Catalog DB: %v", err)
	}
	defer db.Close()

	repo := repository.NewCatalogRepository(db)
	h := handler.NewCatalogHandler(repo)

	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Heartbeat("/ping"))

	r.Route("/api/v1/catalog", func(r chi.Router) {
		r.Get("/restaurants", h.ListRestaurants)
		r.Get("/restaurants/{id}", h.GetRestaurant)
	})

	r.Route("/internal", func(r chi.Router) {
		r.Get("/tables/{id}", h.InternalGetTable)
		r.Post("/restaurants/{id}/rating", h.InternalUpdateRestaurantRating)
	})

	log.Println("Catalog Service starting on :8002...")
	if err := http.ListenAndServe(":8002", r); err != nil {
		log.Fatalf("Could not start server: %v", err)
	}
}
