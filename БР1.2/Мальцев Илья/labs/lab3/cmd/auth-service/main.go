package main

import (
	"log"

	"job-search-microservices/internal/auth"
	"job-search-microservices/internal/platform"
)

func main() {
	log.Fatal(platform.Listen("auth-service", "8081", auth.New().Handler()))
}
