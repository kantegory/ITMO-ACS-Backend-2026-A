package main

import (
	"log"
	"net/http"
	"os"

	"job-search-api/internal/app"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	server := &http.Server{
		Addr:    ":" + port,
		Handler: app.New().Handler(),
	}

	log.Printf("job search API is listening on http://localhost:%s/api/v1", port)
	log.Fatal(server.ListenAndServe())
}
