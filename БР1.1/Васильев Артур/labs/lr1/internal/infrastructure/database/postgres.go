package database

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/jackc/pgx/v5/pgxpool"

	"jobsearch/pkg/slogutil"
)

func NewPool(ctx context.Context, databaseURL string) (*pgxpool.Pool, error) {
	slogutil.LogInfo(ctx, slogutil.LayerRepository, "postgres", "connecting to database")

	cfg, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		slogutil.LogError(ctx, slogutil.LayerRepository, "postgres", "parse database url failed", err)
		return nil, fmt.Errorf("parse database url: %w", err)
	}
	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		slogutil.LogError(ctx, slogutil.LayerRepository, "postgres", "create pool failed", err)
		return nil, fmt.Errorf("connect database: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		slogutil.LogError(ctx, slogutil.LayerRepository, "postgres", "ping failed", err)
		return nil, fmt.Errorf("ping database: %w", err)
	}

	slogutil.LogInfo(ctx, slogutil.LayerRepository, "postgres", "database connected",
		slog.String("host", cfg.ConnConfig.Host),
		slog.Int("port", int(cfg.ConnConfig.Port)),
		slog.String("database", cfg.ConnConfig.Database),
	)
	return pool, nil
}
