package main

import (
	"log"
	"os"

	"recipe-lab1/internal/controller"
	"recipe-lab1/internal/store"
)

func main() {
	address := ":8080"
	if value := os.Getenv("PORT"); value != "" {
		address = ":" + value
	}

	appStore := store.NewMemoryStore()
	router := controller.NewRouter(appStore)

	log.Printf("Recipe Sharing API is listening on http://localhost%s/api/v1", address)
	if err := router.Run(address); err != nil {
		log.Fatal(err)
	}
}
