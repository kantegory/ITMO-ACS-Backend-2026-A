package slogutil

import (
	"context"
	"errors"
	"log/slog"
	"os"
	"strings"
)

const (
	LayerMain       = "main"
	LayerHandler    = "handler"
	LayerUsecase    = "usecase"
	LayerRepository = "repository"
	LayerMiddleware = "middleware"
	LayerHTTP       = "http"
	LayerEvents     = "events"
	LayerClient     = "client"
)

type ctxKey string

const requestIDKey ctxKey = "request_id"

func Setup(service string) {
	level := parseLevel(os.Getenv("LOG_LEVEL"))
	h := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: level})
	slog.SetDefault(slog.New(h).With("service", service))
	slog.Info("logger initialized", "level", level.String(), "service", service)
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

func RequestID(ctx context.Context) string {
	id, _ := ctx.Value(requestIDKey).(string)
	return id
}

func Logger(ctx context.Context, layer, component string) *slog.Logger {
	attrs := []any{
		slog.String("layer", layer),
		slog.String("component", component),
	}
	if id := RequestID(ctx); id != "" {
		attrs = append(attrs, slog.String("request_id", id))
	}
	return slog.Default().With(attrs...)
}

func LogError(ctx context.Context, layer, component, msg string, err error, attrs ...any) {
	if err == nil {
		return
	}
	args := append([]any{slog.String("error", err.Error())}, attrs...)
	var ae interface{ Unwrap() error }
	if errors.As(err, &ae) {
		if u := ae.Unwrap(); u != nil {
			args = append(args, slog.String("unwrap", u.Error()))
		}
	}
	Logger(ctx, layer, component).Error(msg, args...)
}

func LogDebug(ctx context.Context, layer, component, msg string, attrs ...any) {
	Logger(ctx, layer, component).Debug(msg, attrs...)
}

func LogInfo(ctx context.Context, layer, component, msg string, attrs ...any) {
	Logger(ctx, layer, component).Info(msg, attrs...)
}
