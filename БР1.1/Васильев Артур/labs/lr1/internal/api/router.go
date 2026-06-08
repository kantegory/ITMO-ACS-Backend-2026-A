package api

import (
	"net/http"
	"os"
	"path/filepath"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	authhandler "jobsearch/internal/api/handler/auth"
	candidatehandler "jobsearch/internal/api/handler/candidate"
	employerhandler "jobsearch/internal/api/handler/employer"
	referencehandler "jobsearch/internal/api/handler/reference"
	vacancyhandler "jobsearch/internal/api/handler/vacancy"
	"jobsearch/internal/domain"
	"jobsearch/internal/infrastructure/middleware"
	authuc "jobsearch/internal/usecase/auth"
)

type Handlers struct {
	Auth      *authhandler.Handler
	Candidate *candidatehandler.Handler
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
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})

	r.Get("/docs/openapi.yaml", serveOpenAPI)

	r.Route("/api/v1", func(r chi.Router) {
		r.Route("/auth", func(r chi.Router) {
			r.Post("/register/candidate", h.Auth.RegisterCandidate)
			r.Post("/register/employer", h.Auth.RegisterEmployer)
			r.Post("/login", h.Auth.Login)
		})

		r.Get("/industries", h.Reference.ListIndustries)
		r.Get("/experience-levels", h.Reference.ListExperienceLevels)

		r.Get("/vacancies", h.Vacancy.Search)
		r.Get("/vacancies/{id}", h.Vacancy.GetByID)

		r.Group(func(r chi.Router) {
			r.Use(middleware.Auth(h.Tokens))

			r.Route("/candidate", func(r chi.Router) {
				r.Use(middleware.RequireRole(domain.RoleCandidate))
				r.Get("/profile", h.Candidate.GetProfile)
				r.Put("/profile", h.Candidate.UpdateProfile)
				r.Get("/resume", h.Candidate.GetResume)
				r.Put("/resume", h.Candidate.UpsertResume)
				r.Post("/resume/experiences", h.Candidate.AddExperience)
				r.Put("/resume/experiences/{id}", h.Candidate.UpdateExperience)
				r.Delete("/resume/experiences/{id}", h.Candidate.DeleteExperience)
				r.Post("/resume/educations", h.Candidate.AddEducation)
				r.Put("/resume/educations/{id}", h.Candidate.UpdateEducation)
				r.Delete("/resume/educations/{id}", h.Candidate.DeleteEducation)
			})

			r.Route("/employer", func(r chi.Router) {
				r.Use(middleware.RequireRole(domain.RoleEmployer))
				r.Get("/profile", h.Employer.GetProfile)
				r.Put("/profile", h.Employer.UpdateProfile)
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

func serveOpenAPI(w http.ResponseWriter, r *http.Request) {
	path := filepath.Join("docs", "openapi.yaml")
	if _, err := os.Stat(path); os.IsNotExist(err) {
		http.Error(w, "openapi spec not found", http.StatusNotFound)
		return
	}
	http.ServeFile(w, r, path)
}
