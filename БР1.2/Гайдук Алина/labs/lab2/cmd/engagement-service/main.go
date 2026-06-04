package main

import (
	"log/slog"
	"path/filepath"

	"github.com/joho/godotenv"

	"recipehub/internal/config"
	"recipehub/internal/infrastructure/clients/blogclient"
	"recipehub/internal/infrastructure/clients/identityclient"
	"recipehub/internal/infrastructure/clients/recipeclient"
	"recipehub/internal/infrastructure/events/rabbitpublisher"
	infolog "recipehub/internal/infrastructure/logger"
	"recipehub/internal/infrastructure/persistence/engagementrepo"
	"recipehub/internal/platform/messaging/rabbitmq"
	"recipehub/internal/platform/postgres"
	"recipehub/internal/platform/server"
	engagementhttp "recipehub/internal/transport/http/engagement"
	engagementusecase "recipehub/internal/usecase/engagement"
)

const serviceName = "engagement-service"

func main() {
	_ = godotenv.Load(filepath.Join("..", ".env"))
	_ = godotenv.Load(".env")
	infolog.Init()

	cfg := config.LoadService(serviceName, ":8085")

	db, err := postgres.Open(cfg.DatabaseURL)
	if err != nil {
		slog.Error("database connection", "service", cfg.Name, "error", err)
		return
	}

	if err := engagementrepo.AutoMigrate(db); err != nil {
		slog.Error("database migration", "service", cfg.Name, "error", err)
		return
	}

	bus, err := rabbitmq.Dial(cfg.RabbitMQURL, cfg.EventsExchange)
	if err != nil {
		slog.Error("rabbitmq connection", "service", cfg.Name, "error", err)
		return
	}
	defer func() { _ = bus.Close() }()

	service := engagementusecase.NewService(
		engagementrepo.New(db),
		identityclient.New(cfg.IdentityURL, cfg.ServiceToken),
		recipeclient.New(cfg.RecipeURL, cfg.ServiceToken),
		blogclient.New(cfg.BlogURL, cfg.ServiceToken),
		rabbitpublisher.New(bus),
	)

	if err := server.Run(cfg.Name, cfg.Addr, engagementhttp.NewRouter(cfg, service)); err != nil {
		slog.Error("server", "service", cfg.Name, "error", err)
	}
}
