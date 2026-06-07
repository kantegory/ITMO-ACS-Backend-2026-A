package api

import (
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

type ProxyHandlers struct {
	Auth    http.Handler
	Profile http.Handler
	Vacancy http.Handler
}

func NewRouter(p ProxyHandlers) http.Handler {
	r := chi.NewRouter()
	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	r.Get("/health", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"ok","service":"api-gateway"}`))
	})

	r.Handle("/api/v1/*", http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		path := req.URL.Path
		switch {
		case strings.HasPrefix(path, "/api/v1/auth"):
			p.Auth.ServeHTTP(w, req)
		case strings.HasPrefix(path, "/api/v1/candidate"):
			p.Profile.ServeHTTP(w, req)
		case strings.HasPrefix(path, "/api/v1/employer/profile"):
			p.Profile.ServeHTTP(w, req)
		case strings.HasPrefix(path, "/api/v1/employer/vacancies"):
			p.Vacancy.ServeHTTP(w, req)
		case path == "/api/v1/industries" || path == "/api/v1/experience-levels":
			p.Vacancy.ServeHTTP(w, req)
		case path == "/api/v1/vacancies" || strings.HasPrefix(path, "/api/v1/vacancies/"):
			p.Vacancy.ServeHTTP(w, req)
		default:
			http.NotFound(w, req)
		}
	}))

	return r
}
