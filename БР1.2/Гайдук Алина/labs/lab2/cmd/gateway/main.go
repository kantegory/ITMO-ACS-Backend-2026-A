package main

import (
	"log/slog"
	"path/filepath"

	"github.com/joho/godotenv"

	"recipehub/internal/config"
	infolog "recipehub/internal/infrastructure/logger"
	"recipehub/internal/platform/server"
	gatewayhttp "recipehub/internal/transport/http/gateway"
)

const serviceName = "gateway"

func main() {
	_ = godotenv.Load(filepath.Join("..", ".env"))
	_ = godotenv.Load(".env")
	infolog.Init()

	cfg := config.LoadService(serviceName, ":8080")
	if err := server.Run(cfg.Name, cfg.Addr, gatewayhttp.NewRouter(cfg)); err != nil {
		slog.Error("server", "service", cfg.Name, "error", err)
	}
}
