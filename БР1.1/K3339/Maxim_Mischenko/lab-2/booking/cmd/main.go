package main

import (
	"booking/internal/client"
	"booking/internal/handler"
	"booking/internal/repository"
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
		log.Fatalf("Failed to connect to Booking DB: %v", err)
	}
	defer db.Close()

	repo := repository.NewBookingRepository(db)
	catalogCli := &client.CatalogClient{BaseURL: "http://catalog-service:8002"}
	h := handler.NewBookingHandler(repo, catalogCli)

	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Heartbeat("/ping"))

	r.Post("/api/v1/bookings", h.Create)

	log.Println("Catalog Service starting on :8003...")
	if err := http.ListenAndServe(":8003", r); err != nil {
		log.Fatalf("Could not start server: %v", err)
	}
}
