package main

import (
	"context"
	"log"

	"job-search-microservices/internal/notification"
	"job-search-microservices/internal/platform"
)

func main() {
	_, consumer, closeBus := platform.ConfigureMessageBus()
	defer closeBus()

	service := notification.New(consumer)
	go func() {
		if err := service.Start(context.Background()); err != nil {
			log.Printf("notification-service consumer stopped: %v", err)
		}
	}()

	log.Fatal(platform.Listen("notification-service", "8085", service.Handler()))
}
