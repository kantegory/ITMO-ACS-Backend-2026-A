package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

func main() {
	port := getEnv("PORT", "8081")
	dbURL := getEnv("DATABASE_URL", "postgres://postgres:postgres@auth-db:5432/auth_db")

	log.Printf(" Auth Service starting on port %s...", port)
	log.Printf(" Connected to DB: %s", dbURL)

	
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","service":"auth-service"}`))
	})


	http.HandleFunc("/service/users/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"id": 1, "role": "employer", "is_active": true}`))
	})

	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%s", port), nil))
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return fallback
}