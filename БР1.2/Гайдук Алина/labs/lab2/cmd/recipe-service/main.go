package main

import (
	"log/slog"
	"path/filepath"

	"github.com/joho/godotenv"

	"recipehub/internal/config"
	"recipehub/internal/infrastructure/clients/catalogclient"
	"recipehub/internal/infrastructure/clients/engagementclient"
	"recipehub/internal/infrastructure/clients/identityclient"
	infolog "recipehub/internal/infrastructure/logger"
	"recipehub/internal/infrastructure/persistence/reciperepo"
	recipehttp "recipehub/internal/interfaces/http/recipe"
	"recipehub/internal/platform/postgres"
	"recipehub/internal/platform/server"
	recipeusecase "recipehub/internal/usecase/recipe"
)

const serviceName = "recipe-service"

func main() {
	_ = godotenv.Load(filepath.Join("..", ".env"))
	_ = godotenv.Load(".env")
	infolog.Init()

	cfg := config.LoadService(serviceName, ":8083")

	db, err := postgres.Open(cfg.DatabaseURL)
	if err != nil {
		slog.Error("database", "service", cfg.Name, "error", err)
		return
	}
	if err := reciperepo.AutoMigrate(db); err != nil {
		slog.Error("migrate", "service", cfg.Name, "error", err)
		return
	}

	recipeService := recipeusecase.NewService(
		reciperepo.New(db),
		identityclient.New(cfg.IdentityURL, cfg.ServiceToken),
		catalogclient.New(cfg.CatalogURL, cfg.ServiceToken),
		engagementclient.New(cfg.EngagementURL, cfg.ServiceToken),
	)

	if err := server.Run(cfg.Name, cfg.Addr, recipehttp.NewRouter(cfg, recipeService)); err != nil {
		slog.Error("server", "service", cfg.Name, "error", err)
	}
}
