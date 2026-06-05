package health

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"

	"recipehub/internal/infrastructure/middleware"
	"recipehub/internal/transport/http/response"
)

func NewRouter(serviceName string) http.Handler {
	r := chi.NewRouter()
	r.Use(chimw.RequestID)
	r.Use(middleware.Recovery)

	r.Get("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		response.RespondJSON(w, http.StatusOK, map[string]any{
			"status":  "ok",
			"service": serviceName,
		})
	})

	return r
}
