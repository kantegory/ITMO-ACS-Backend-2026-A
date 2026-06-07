package slogutil

import (
	"context"
	"log/slog"
	"os"
	"strings"
)

const (
	LayerMain       = "main"
	LayerMiddleware = "middleware"
)

type ctxKey string

const requestIDKey ctxKey = "request_id"

func Setup(service string) {
	level := parseLevel(os.Getenv("LOG_LEVEL"))
	h := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: level})
	slog.SetDefault(slog.New(h).With("service", service))
}

func parseLevel(raw string) slog.Level {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "debug":
		return slog.LevelDebug
	case "warn", "warning":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}

func WithRequestID(ctx context.Context, requestID string) context.Context {
	return context.WithValue(ctx, requestIDKey, requestID)
}

func Logger(ctx context.Context, layer, component string) *slog.Logger {
	attrs := []any{slog.String("layer", layer), slog.String("component", component)}
	if id, _ := ctx.Value(requestIDKey).(string); id != "" {
		attrs = append(attrs, slog.String("request_id", id))
	}
	return slog.Default().With(attrs...)
}
