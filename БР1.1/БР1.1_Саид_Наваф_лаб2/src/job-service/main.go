package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

func main() {
	port := getEnv("PORT", "8082")
	dbURL := getEnv("DATABASE_URL", "postgres://postgres:postgres@job-db:5432/job_db")

	log.Printf("💼 Job Service starting on port %s...", port)
	log.Printf("️ Connected to DB: %s", dbURL)

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","service":"job-service"}`))
	})

	// Внутренний эндпоинт из ДЗ4: проверка вакансии
	http.HandleFunc("/service/vacancies/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"id": 1, "employer_id": 1, "title": "Go Developer", "is_active": true}`))
	})

	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%s", port), nil))
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok { return val }
	return fallback
}