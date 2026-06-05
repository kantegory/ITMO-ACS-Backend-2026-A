package main

import (
	"context"
	"log/slog"
	"path/filepath"

	"github.com/joho/godotenv"

	"recipehub/internal/config"
	"recipehub/internal/domain/events"
	"recipehub/internal/infrastructure/clients/engagementclient"
	"recipehub/internal/infrastructure/clients/identityclient"
	"recipehub/internal/infrastructure/events/rabbitconsumer"
	infolog "recipehub/internal/infrastructure/logger"
	"recipehub/internal/infrastructure/persistence/blogrepo"
	"recipehub/internal/platform/messaging/rabbitmq"
	"recipehub/internal/platform/postgres"
	"recipehub/internal/platform/server"
	bloghttp "recipehub/internal/transport/http/blog"
	blogusecase "recipehub/internal/usecase/blog"
)

const serviceName = "blog-service"

func main() {
	_ = godotenv.Load(filepath.Join("..", ".env"))
	_ = godotenv.Load(".env")
	infolog.Init()

	cfg := config.LoadService(serviceName, ":8084")

	db, err := postgres.Open(cfg.DatabaseURL)
	if err != nil {
		slog.Error("database", "service", cfg.Name, "error", err)
		return
	}
	if err := blogrepo.AutoMigrate(db); err != nil {
		slog.Error("migrate", "service", cfg.Name, "error", err)
		return
	}

	blogService := blogusecase.NewService(
		blogrepo.New(db),
		identityclient.New(cfg.IdentityURL, cfg.ServiceToken),
		engagementclient.New(cfg.EngagementURL, cfg.ServiceToken),
	)

	bus, err := rabbitmq.Dial(cfg.RabbitMQURL, cfg.EventsExchange)
	if err != nil {
		slog.Error("rabbitmq connection", "service", cfg.Name, "error", err)
		return
	}
	defer func() { _ = bus.Close() }()
	if err := rabbitconsumer.Start(
		context.Background(),
		bus,
		"blog-service.engagement-projections",
		[]string{
			events.TypePostLiked,
			events.TypePostUnliked,
			events.TypePostCommentCreated,
			events.TypePostCommentDeleted,
		},
		blogService.HandleIntegrationEvent,
	); err != nil {
		slog.Error("rabbitmq consumer", "service", cfg.Name, "error", err)
		return
	}

	if err := server.Run(cfg.Name, cfg.Addr, bloghttp.NewRouter(cfg, blogService)); err != nil {
		slog.Error("server", "service", cfg.Name, "error", err)
	}
}
