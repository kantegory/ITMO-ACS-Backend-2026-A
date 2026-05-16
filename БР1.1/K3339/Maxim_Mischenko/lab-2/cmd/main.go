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
	dbConn := os.Getenv("DATABASE_URL")
	if dbConn == "" {
		dbConn = "user=postgres password=pass52 dbname=catalog_db sslmode=disable"
	}

	repo := repository.NewCatalogRepository(db)
	h := handler.NewCatalogHandler(repo)

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer())

	r.Route("/internal", func(r chi.Router) {
		r.Get("/tables/{id}", h.InternalGetTable)
	})

	log.Println("Catalog Service starting on :8002...")
	http.ListenAndServe(":8002", r)
}
