package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	employerhandler "vacancy-service/internal/api/handler/employer"
	referencehandler "vacancy-service/internal/api/handler/reference"
	vacancyhandler "vacancy-service/internal/api/handler/vacancy"
	"vacancy-service/internal/domain"
	"vacancy-service/internal/infrastructure/middleware"
	authuc "vacancy-service/internal/usecase/auth"
)

type Handlers struct {
	Employer  *employerhandler.Handler
	Vacancy   *vacancyhandler.Handler
	Reference *referencehandler.Handler
	Tokens    authuc.TokenProvider
}

func NewRouter(h Handlers) http.Handler {
	r := chi.NewRouter()
	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(middleware.RequestContext)
	r.Use(middleware.Logger)
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
		_, _ = w.Write([]byte(`{"status":"ok","service":"vacancy-service"}`))
	})

	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/industries", h.Reference.ListIndustries)
		r.Get("/experience-levels", h.Reference.ListExperienceLevels)

		r.Get("/vacancies", h.Vacancy.Search)
		r.Get("/vacancies/{id}", h.Vacancy.GetByID)

		r.Group(func(r chi.Router) {
			r.Use(middleware.Auth(h.Tokens))

			r.Route("/employer", func(r chi.Router) {
				r.Use(middleware.RequireRole(domain.RoleEmployer))
				r.Get("/vacancies", h.Employer.ListVacancies)
				r.Post("/vacancies", h.Employer.CreateVacancy)
				r.Get("/vacancies/{id}", h.Employer.GetVacancy)
				r.Put("/vacancies/{id}", h.Employer.UpdateVacancy)
				r.Delete("/vacancies/{id}", h.Employer.DeleteVacancy)
				r.Patch("/vacancies/{id}/publish", h.Employer.Publish)
				r.Patch("/vacancies/{id}/unpublish", h.Employer.Unpublish)
			})
		})
	})

	return r
}
