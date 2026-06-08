package main

import (
	"log"

	"job-search-microservices/internal/catalog"
	"job-search-microservices/internal/platform"
)

func main() {
	log.Fatal(platform.Listen("catalog-service", "8082", catalog.New().Handler()))
}
