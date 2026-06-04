package main

import (
	"log/slog"
	"path/filepath"

	"github.com/joho/godotenv"

	"recipehub/internal/config"
	"recipehub/internal/infrastructure/clients/blogclient"
	"recipehub/internal/infrastructure/clients/identityclient"
	"recipehub/internal/infrastructure/clients/recipeclient"
	infolog "recipehub/internal/infrastructure/logger"
	"recipehub/internal/infrastructure/persistence/engagementrepo"
	engagementhttp "recipehub/internal/interfaces/http/engagement"
	"recipehub/internal/platform/postgres"
	"recipehub/internal/platform/server"
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

	service := engagementusecase.NewService(
		engagementrepo.New(db),
		identityclient.New(cfg.IdentityURL, cfg.ServiceToken),
		recipeclient.New(cfg.RecipeURL, cfg.ServiceToken),
		blogclient.New(cfg.BlogURL, cfg.ServiceToken),
	)

	if err := server.Run(cfg.Name, cfg.Addr, engagementhttp.NewRouter(cfg, service)); err != nil {
		slog.Error("server", "service", cfg.Name, "error", err)
	}
}
