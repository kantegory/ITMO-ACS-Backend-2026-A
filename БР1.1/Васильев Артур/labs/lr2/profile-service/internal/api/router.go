package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	candidatehandler "profile-service/internal/api/handler/candidate"
	employerhandler "profile-service/internal/api/handler/employer"
	internalhandler "profile-service/internal/api/handler/internalapi"
	"profile-service/internal/domain"
	"profile-service/internal/infrastructure/middleware"
	authuc "profile-service/internal/usecase/auth"
)

type Handlers struct {
	Candidate *candidatehandler.Handler
	Employer  *employerhandler.Handler
	Internal  *internalhandler.Handler
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
		_, _ = w.Write([]byte(`{"status":"ok","service":"profile-service"}`))
	})

	r.Post("/internal/v1/profiles", h.Internal.CreateProfile)
	r.Get("/internal/v1/employers/{userId}/exists", h.Internal.EmployerExists)
	r.Get("/internal/v1/candidates/{userId}/exists", h.Internal.CandidateExists)
	r.Get("/internal/v1/employers/{userId}/company-name", h.Internal.GetEmployerCompanyName)

	r.Route("/api/v1", func(r chi.Router) {
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
			})
		})
	})

	return r
}
