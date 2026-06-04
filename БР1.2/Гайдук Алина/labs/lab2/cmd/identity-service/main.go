package main

import (
	"log/slog"
	"path/filepath"

	"github.com/joho/godotenv"

	"recipehub/internal/config"
	infolog "recipehub/internal/infrastructure/logger"
	health "recipehub/internal/interfaces/http/health"
	"recipehub/internal/platform/server"
)

const serviceName = "identity-service"

func main() {
	_ = godotenv.Load(filepath.Join("..", ".env"))
	_ = godotenv.Load(".env")
	infolog.Init()

	cfg := config.LoadService(serviceName, ":8081")
	if err := server.Run(cfg.Name, cfg.Addr, health.NewRouter(cfg.Name)); err != nil {
		slog.Error("server", "service", cfg.Name, "error", err)
	}
}
