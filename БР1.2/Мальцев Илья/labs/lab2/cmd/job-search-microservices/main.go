package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"job-search-microservices/internal/applicant"
	"job-search-microservices/internal/auth"
	"job-search-microservices/internal/catalog"
	"job-search-microservices/internal/employer"
	"job-search-microservices/internal/gateway"
	"job-search-microservices/internal/notification"
	"job-search-microservices/internal/platform"
)

func main() {
	ports := servicePorts{
		Gateway:      env("GATEWAY_PORT", "8080"),
		Auth:         env("AUTH_PORT", "8081"),
		Catalog:      env("CATALOG_PORT", "8082"),
		Applicant:    env("APPLICANT_PORT", "8083"),
		Employer:     env("EMPLOYER_PORT", "8084"),
		Notification: env("NOTIFICATION_PORT", "8085"),
	}

	authURL := "http://localhost:" + ports.Auth
	catalogURL := "http://localhost:" + ports.Catalog
	applicantURL := "http://localhost:" + ports.Applicant
	employerURL := "http://localhost:" + ports.Employer

	publisher, consumer, closeBus := configureMessageBus()
	defer closeBus()

	authService := auth.New()
	catalogService := catalog.New()
	applicantService := applicant.NewWithPublisher(authURL, catalogURL, publisher)
	employerService := employer.New(authURL, catalogURL, applicantURL)
	notificationService := notification.New(consumer)

	apiGateway, err := gateway.New(gateway.Config{
		AuthURL:      authURL,
		CatalogURL:   catalogURL,
		ApplicantURL: applicantURL,
		EmployerURL:  employerURL,
	})
	if err != nil {
		log.Fatal(err)
	}

	servers := []serverConfig{
		{Name: "auth-service", Port: ports.Auth, Handler: authService.Handler()},
		{Name: "catalog-service", Port: ports.Catalog, Handler: catalogService.Handler()},
		{Name: "applicant-service", Port: ports.Applicant, Handler: applicantService.Handler()},
		{Name: "employer-service", Port: ports.Employer, Handler: employerService.Handler()},
		{Name: "notification-service", Port: ports.Notification, Handler: notificationService.Handler()},
		{Name: "api-gateway", Port: ports.Gateway, Handler: apiGateway.Handler()},
	}

	go func() {
		if err := notificationService.Start(context.Background()); err != nil {
			log.Printf("notification-service consumer stopped: %v", err)
		}
	}()

	errors := make(chan error, len(servers))
	for _, server := range servers {
		go start(server, errors)
	}

	log.Printf("public API: http://localhost:%s/api/v1", ports.Gateway)
	log.Fatal(<-errors)
}

type servicePorts struct {
	Gateway      string
	Auth         string
	Catalog      string
	Applicant    string
	Employer     string
	Notification string
}

type serverConfig struct {
	Name    string
	Port    string
	Handler http.Handler
}

func start(config serverConfig, errors chan<- error) {
	log.Printf("%s is listening on http://localhost:%s", config.Name, config.Port)
	errors <- http.ListenAndServe(":"+config.Port, config.Handler)
}

func env(name string, defaultValue string) string {
	value := os.Getenv(name)
	if value == "" {
		return defaultValue
	}
	return value
}

func configureMessageBus() (platform.EventPublisher, platform.EventConsumer, func()) {
	rabbitURL := env("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")
	bus, err := connectRabbitMQ(rabbitURL, 5, time.Second)
	if err != nil {
		log.Printf("rabbitmq is not available, message events are disabled: %v", err)
		return platform.NoopPublisher{}, platform.NoopConsumer{}, func() {}
	}

	log.Printf("rabbitmq connected: exchange=%s", platform.EventsExchange)
	return bus, bus, func() {
		if err := bus.Close(); err != nil {
			log.Printf("rabbitmq close error: %v", err)
		}
	}
}

func connectRabbitMQ(url string, attempts int, delay time.Duration) (*platform.RabbitMQ, error) {
	var lastErr error
	for attempt := 1; attempt <= attempts; attempt++ {
		bus, err := platform.NewRabbitMQ(url)
		if err == nil {
			return bus, nil
		}

		lastErr = err
		log.Printf("rabbitmq connection attempt %d/%d failed: %v", attempt, attempts, err)
		time.Sleep(delay)
	}

	return nil, lastErr
}
