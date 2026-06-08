package main

import (
	"log"

	"job-search-microservices/internal/gateway"
	"job-search-microservices/internal/platform"
)

func main() {
	apiGateway, err := gateway.New(gateway.Config{
		AuthURL:      platform.Env("AUTH_URL", "http://localhost:8081"),
		CatalogURL:   platform.Env("CATALOG_URL", "http://localhost:8082"),
		ApplicantURL: platform.Env("APPLICANT_URL", "http://localhost:8083"),
		EmployerURL:  platform.Env("EMPLOYER_URL", "http://localhost:8084"),
	})
	if err != nil {
		log.Fatal(err)
	}

	log.Fatal(platform.Listen("api-gateway", "8080", apiGateway.Handler()))
}
