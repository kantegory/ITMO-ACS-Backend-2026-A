package main

import (
	"log/slog"
	"net/http"
	"path/filepath"

	"github.com/joho/godotenv"

	"recipehub/internal/config"
	"recipehub/internal/httpserver"
	"recipehub/internal/infrastructure/database"
	infolog "recipehub/internal/infrastructure/logger"
)

func main() {
	// Два отдельных вызова: если labs/.env нет, godotenv.Load не должен блокировать lab1/.env.
	_ = godotenv.Load(filepath.Join("..", ".env"))
	_ = godotenv.Load(".env")
	infolog.Init()

	cfg := config.Load()

	gdb, err := database.Open(cfg)
	if err != nil {
		slog.Error("database", "error", err)
		return
	}
	store := database.NewStore(gdb)

	h := httpserver.NewRouter(cfg, store)
	slog.Info("listening", "addr", cfg.Addr)

	if err := http.ListenAndServe(cfg.Addr, h); err != nil {
		slog.Error("server", "error", err)
	}
}
