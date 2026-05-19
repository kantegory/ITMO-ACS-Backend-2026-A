package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

func main() {
	port := getEnv("PORT", "8083")
	dbURL := getEnv("DATABASE_URL", "postgres://postgres:postgres@cand-db:5432/cand_db")

	log.Printf(" Candidate Service starting on port %s...", port)
	log.Printf(" Connected to DB: %s", dbURL)

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","service":"candidate-service"}`))
	})

	// Внутренний эндпоинт из ДЗ4: проверка резюме
	http.HandleFunc("/service/resumes/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"id": 1, "applicant_id": 2, "desired_position": "Backend Developer"}`))
	})

	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%s", port), nil))
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok { return val }
	return fallback
}