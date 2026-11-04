package observability

import (
	"context"
	"database/sql"
	"log"
	"time"

	"github.com/getsentry/sentry-go"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/health"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/status"
)

// UnaryServerInterceptor отправляет в Sentry серверные ошибки gRPC-методов
// (Internal/Unknown/DataLoss/Unavailable) и перехватывает паники, превращая их
// в codes.Internal вместо падения всего процесса.
func UnaryServerInterceptor() grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (resp any, err error) {
		hub := sentry.CurrentHub().Clone()
		hub.Scope().SetTag("grpc.method", info.FullMethod)
		ctx = sentry.SetHubOnContext(ctx, hub)

		defer func() {
			if r := recover(); r != nil {
				log.Printf("panic in %s: %v", info.FullMethod, r)
				hub.RecoverWithContext(ctx, r)
				err = status.Error(codes.Internal, "internal error")
			}
		}()

		resp, err = handler(ctx, req)
		if err != nil && isServerError(err) {
			hub.WithScope(func(scope *sentry.Scope) {
				scope.SetTag("grpc.code", status.Code(err).String())
				hub.CaptureException(err)
			})
		}
		return resp, err
	}
}

func isServerError(err error) bool {
	switch status.Code(err) {
	case codes.Internal, codes.Unknown, codes.DataLoss, codes.Unavailable:
		return true
	default:
		return false
	}
}

// RegisterHealth регистрирует стандартный gRPC Health Checking Protocol
// (grpc.health.v1.Health) и раз в interval обновляет статус по db.Ping():
// SERVING, если БД доступна, иначе NOT_SERVING. Этот эндпоинт опрашивает
// blackbox_exporter (модуль grpc) для дашборда Grafana.
func RegisterHealth(s *grpc.Server, db *sql.DB, service string, interval time.Duration) {
	hs := health.NewServer()
	healthpb.RegisterHealthServer(s, hs)

	update := func() {
		st := healthpb.HealthCheckResponse_SERVING
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		if err := db.PingContext(ctx); err != nil {
			st = healthpb.HealthCheckResponse_NOT_SERVING
		}
		cancel()
		hs.SetServingStatus("", st)
		hs.SetServingStatus(service, st)
	}
	update()

	go func() {
		t := time.NewTicker(interval)
		defer t.Stop()
		for range t.C {
			update()
		}
	}()
}
