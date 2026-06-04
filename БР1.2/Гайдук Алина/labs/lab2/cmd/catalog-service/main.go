package main

import (
	"context"
	"log/slog"
	"path/filepath"

	"github.com/joho/godotenv"

	"recipehub/internal/config"
	infolog "recipehub/internal/infrastructure/logger"
	"recipehub/internal/infrastructure/persistence/catalogrepo"
	cataloghttp "recipehub/internal/interfaces/http/catalog"
	"recipehub/internal/platform/postgres"
	"recipehub/internal/platform/server"
	catalogusecase "recipehub/internal/usecase/catalog"
)

const serviceName = "catalog-service"

func main() {
	_ = godotenv.Load(filepath.Join("..", ".env"))
	_ = godotenv.Load(".env")
	infolog.Init()

	cfg := config.LoadService(serviceName, ":8082")

	db, err := postgres.Open(cfg.DatabaseURL)
	if err != nil {
		slog.Error("database", "service", cfg.Name, "error", err)
		return
	}
	if err := catalogrepo.AutoMigrate(db); err != nil {
		slog.Error("migrate", "service", cfg.Name, "error", err)
		return
	}
	if err := catalogrepo.SeedDefaults(context.Background(), db); err != nil {
		slog.Error("seed", "service", cfg.Name, "error", err)
		return
	}

	catalogService := catalogusecase.NewService(catalogrepo.New(db))

	if err := server.Run(cfg.Name, cfg.Addr, cataloghttp.NewRouter(cfg, catalogService)); err != nil {
		slog.Error("server", "service", cfg.Name, "error", err)
	}
}
