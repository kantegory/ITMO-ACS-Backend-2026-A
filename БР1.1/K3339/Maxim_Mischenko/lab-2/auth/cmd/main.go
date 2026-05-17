package main

import (
	"auth/internal/handler"
	"auth/internal/repository"
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
		log.Fatalf("Failed to connect to Auth DB: %v", err)
	}
	defer db.Close()

	repo := repository.NewAuthRepository(db)
	h := handler.NewAuthHandler(repo)

	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Heartbeat("/ping"))

	r.Route("/auth", func(r chi.Router) {
		r.Post("/register", h.Register)
		r.Post("/login", h.Login)
	})

	log.Println("Auth Service starting on :8001...")
	if err := http.ListenAndServe(":8001", r); err != nil {
		log.Fatalf("Could not start server: %v", err)
	}
}
