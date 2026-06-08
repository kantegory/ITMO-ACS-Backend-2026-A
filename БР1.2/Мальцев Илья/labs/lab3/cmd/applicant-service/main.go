package main

import (
	"log"

	"job-search-microservices/internal/applicant"
	"job-search-microservices/internal/platform"
)

func main() {
	publisher, _, closeBus := platform.ConfigureMessageBus()
	defer closeBus()

	service := applicant.NewWithPublisher(
		platform.Env("AUTH_URL", "http://localhost:8081"),
		platform.Env("CATALOG_URL", "http://localhost:8082"),
		publisher,
	)

	log.Fatal(platform.Listen("applicant-service", "8083", service.Handler()))
}
