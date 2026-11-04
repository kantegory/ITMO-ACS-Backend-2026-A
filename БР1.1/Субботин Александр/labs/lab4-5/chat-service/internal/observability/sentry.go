// Package observability — интеграция сервиса с Sentry (ЛР5, доп. задание).
//
// SDK настраивается только переменными окружения, поэтому один и тот же образ
// работает и с self-hosted Sentry, и с облачным sentry.io:
//
//	SENTRY_DSN                — DSN проекта; пусто → Sentry отключён (все вызовы no-op)
//	SENTRY_ENVIRONMENT        — окружение (local / production)
//	SENTRY_RELEASE            — версия релиза (в CI подставляется git sha)
//	SENTRY_TRACES_SAMPLE_RATE — доля запросов для performance-трейсинга (0..1)
//	SENTRY_DEBUG              — true → подробный лог SDK
//	SENTRY_DEBUG_ROUTE        — true → включает GET /debug/sentry (тестовая паника)
package observability

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/getsentry/sentry-go"
	sentrygin "github.com/getsentry/sentry-go/gin"
	"github.com/gin-gonic/gin"
)

var serviceName = "unknown"

// InitSentry инициализирует SDK и возвращает функцию flush, которую нужно
// вызвать перед завершением процесса, чтобы не потерять буферизованные события.
func InitSentry(service string) (flush func()) {
	serviceName = service
	dsn := os.Getenv("SENTRY_DSN")
	if dsn == "" {
		log.Printf("%s: SENTRY_DSN is empty, sentry disabled", service)
		return func() {}
	}

	tracesRate, _ := strconv.ParseFloat(os.Getenv("SENTRY_TRACES_SAMPLE_RATE"), 64)
	err := sentry.Init(sentry.ClientOptions{
		Dsn:              dsn,
		Environment:      getEnv("SENTRY_ENVIRONMENT", "local"),
		Release:          os.Getenv("SENTRY_RELEASE"),
		ServerName:       service,
		AttachStacktrace: true,
		EnableTracing:    tracesRate > 0,
		TracesSampleRate: tracesRate,
		Debug:            os.Getenv("SENTRY_DEBUG") == "true",
	})
	if err != nil {
		log.Printf("%s: sentry init failed: %v", service, err)
		return func() {}
	}
	sentry.ConfigureScope(func(scope *sentry.Scope) {
		scope.SetTag("service", service)
	})
	log.Printf("%s: sentry enabled (environment=%s)", service, getEnv("SENTRY_ENVIRONMENT", "local"))
	return func() { sentry.Flush(2 * time.Second) }
}

// GinMiddleware подключает Sentry к gin-роутеру:
//   - sentrygin перехватывает паники (Repanic: true — дальше их обрабатывает gin.Recovery);
//   - captureServerErrors отправляет в Sentry ответы со статусом >= minStatus,
//     которые хендлеры вернули без паники (например, 500 при недоступной БД).
func GinMiddleware(r *gin.Engine, minStatus int) {
	r.Use(sentrygin.New(sentrygin.Options{Repanic: true, Timeout: 2 * time.Second}))
	r.Use(captureServerErrors(minStatus))
}

func captureServerErrors(minStatus int) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		code := c.Writer.Status()
		route := c.FullPath()
		if code < minStatus || route == "/health" {
			return
		}
		if route == "" {
			route = c.Request.URL.Path
		}

		hub := sentrygin.GetHubFromContext(c)
		if hub == nil {
			hub = sentry.CurrentHub().Clone()
		}
		hub.WithScope(func(scope *sentry.Scope) {
			scope.SetTag("http.status_code", strconv.Itoa(code))
			scope.SetTag("http.route", route)
			scope.SetLevel(sentry.LevelError)
			if len(c.Errors) > 0 {
				hub.CaptureException(c.Errors.Last().Err)
				return
			}
			hub.CaptureMessage(fmt.Sprintf("HTTP %d %s %s", code, c.Request.Method, route))
		})
	}
}

// RegisterDebugRoute добавляет GET /debug/sentry, который паникует, — чтобы
// проверить доставку событий. Включается только при SENTRY_DEBUG_ROUTE=true.
func RegisterDebugRoute(r *gin.Engine) {
	if os.Getenv("SENTRY_DEBUG_ROUTE") != "true" {
		return
	}
	r.GET("/debug/sentry", func(c *gin.Context) {
		panic(fmt.Sprintf("sentry test panic from %s", serviceName))
	})
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
