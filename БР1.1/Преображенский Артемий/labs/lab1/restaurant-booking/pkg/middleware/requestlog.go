package middleware

import (
	"net/http"
	"time"

	"restaurant-booking/pkg/logger"
)

type loggedResponseWriter struct {
	http.ResponseWriter
	status int
	size   int
}

func (w *loggedResponseWriter) WriteHeader(status int) {
	w.status = status
	w.ResponseWriter.WriteHeader(status)
}

func (w *loggedResponseWriter) Write(p []byte) (int, error) {
	if w.status == 0 {
		w.status = http.StatusOK
	}
	n, err := w.ResponseWriter.Write(p)
	w.size += n
	return n, err
}

func RequestLog(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		lw := &loggedResponseWriter{ResponseWriter: w}
		next.ServeHTTP(lw, r)
		d := time.Since(start)
		logger.L.Printf("%s %s %d %d %s", r.Method, r.URL.Path, lw.status, lw.size, d.String())
	})
}
