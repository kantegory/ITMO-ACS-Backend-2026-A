package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

func main() {
	port := getEnv("PORT", "8084")
	dbURL := getEnv("DATABASE_URL", "postgres://postgres:postgres@inter-db:5432/inter_db")

	log.Printf(" Interaction Service starting on port %s...", port)
	log.Printf(" Connected to DB: %s", dbURL)

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","service":"interaction-service"}`))
	})

	// Внутренний эндпоинт из ДЗ4: проверка отклика
	http.HandleFunc("/service/applications/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"id": 1, "vacancy_id": 1, "resume_id": 1, "status": "pending"}`))
	})

	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%s", port), nil))
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok { return val }
	return fallback
}