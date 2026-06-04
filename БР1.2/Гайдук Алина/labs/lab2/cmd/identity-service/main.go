package main

import (
	"log/slog"
	"path/filepath"

	"github.com/joho/godotenv"

	"recipehub/internal/config"
	infolog "recipehub/internal/infrastructure/logger"
	"recipehub/internal/infrastructure/persistence/identityrepo"
	"recipehub/internal/infrastructure/security/tokenmanager"
	identityhttp "recipehub/internal/interfaces/http/identity"
	"recipehub/internal/platform/postgres"
	"recipehub/internal/platform/server"
	identityusecase "recipehub/internal/usecase/identity"
)

const serviceName = "identity-service"

func main() {
	_ = godotenv.Load(filepath.Join("..", ".env"))
	_ = godotenv.Load(".env")
	infolog.Init()

	cfg := config.LoadService(serviceName, ":8081")

	db, err := postgres.Open(cfg.DatabaseURL)
	if err != nil {
		slog.Error("database", "service", cfg.Name, "error", err)
		return
	}
	if err := identityrepo.AutoMigrate(db); err != nil {
		slog.Error("migrate", "service", cfg.Name, "error", err)
		return
	}

	identityService := identityusecase.NewService(
		identityrepo.New(db),
		tokenmanager.New(cfg.JWTAccessSecret),
		identityusecase.Config{
			AccessTTLSeconds:  cfg.AccessTTLSeconds,
			RefreshTTLSeconds: cfg.RefreshTTLSeconds,
		},
	)

	if err := server.Run(cfg.Name, cfg.Addr, identityhttp.NewRouter(cfg, identityService)); err != nil {
		slog.Error("server", "service", cfg.Name, "error", err)
	}
}
