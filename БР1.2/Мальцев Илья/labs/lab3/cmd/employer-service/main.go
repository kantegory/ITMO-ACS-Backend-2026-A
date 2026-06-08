package main

import (
	"log"

	"job-search-microservices/internal/employer"
	"job-search-microservices/internal/platform"
)

func main() {
	service := employer.New(
		platform.Env("AUTH_URL", "http://localhost:8081"),
		platform.Env("CATALOG_URL", "http://localhost:8082"),
		platform.Env("APPLICANT_URL", "http://localhost:8083"),
	)

	log.Fatal(platform.Listen("employer-service", "8084", service.Handler()))
}
