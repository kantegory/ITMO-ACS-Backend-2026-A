package handler

import (
	"net/http"

	"job-search-api/internal/middleware"
	"job-search-api/internal/repository"
)

func NewRouter(repos *repository.Repositories, jwtSecret string) http.Handler {
	mux := http.NewServeMux()

	authHandler := NewAuthHandler(repos, jwtSecret)
	mux.HandleFunc("POST /api/v1/auth/register", authHandler.Register)
	mux.HandleFunc("POST /api/v1/auth/login", authHandler.Login)


	categoriesHandler := NewCategoriesHandler(repos)
	mux.HandleFunc("GET /api/v1/categories", categoriesHandler.ListCategories)


	vacanciesHandler := NewVacanciesHandler(repos)
	mux.HandleFunc("GET /api/v1/vacancies", vacanciesHandler.ListVacancies)
	mux.HandleFunc("GET /api/v1/vacancies/{id}", vacanciesHandler.GetVacancyByID)
	mux.Handle("POST /api/v1/vacancies", middleware.JWTMiddleware(jwtSecret)(http.HandlerFunc(vacanciesHandler.CreateVacancy)))


	resumesHandler := NewResumesHandler(repos)
	mux.HandleFunc("GET /api/v1/resumes", resumesHandler.ListResumes)
	mux.HandleFunc("GET /api/v1/resumes/{id}", resumesHandler.GetResumeByID)
	mux.Handle("POST /api/v1/resumes", middleware.JWTMiddleware(jwtSecret)(http.HandlerFunc(resumesHandler.CreateResume)))


	appsHandler := NewApplicationsHandler(repos)
	mux.Handle("POST /api/v1/applications", middleware.JWTMiddleware(jwtSecret)(http.HandlerFunc(appsHandler.CreateApplication)))
	mux.Handle("GET /api/v1/applications", middleware.JWTMiddleware(jwtSecret)(http.HandlerFunc(appsHandler.ListMyApplications)))
	mux.Handle("GET /api/v1/employer/applications", middleware.JWTMiddleware(jwtSecret)(http.HandlerFunc(appsHandler.ListEmployerApplications)))
	mux.Handle("PATCH /api/v1/applications/{id}/status", middleware.JWTMiddleware(jwtSecret)(http.HandlerFunc(appsHandler.UpdateApplicationStatus)))


	profileHandler := NewProfileHandler(repos)
	mux.Handle("GET /api/v1/profile", middleware.JWTMiddleware(jwtSecret)(http.HandlerFunc(profileHandler.GetProfile)))

	return mux
}