package routes

import (
	"jobboard/internal/config"
	"jobboard/internal/handlers"
	"jobboard/internal/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRouter(cfg *config.Config) *gin.Engine {
	r := gin.Default()

	authHandler := handlers.NewAuthHandler(cfg)
	profileHandler := handlers.NewProfileHandler()
	companyHandler := handlers.NewCompanyHandler()
	dictionaryHandler := handlers.NewDictionaryHandler()
	resumeHandler := handlers.NewResumeHandler()
	jobHandler := handlers.NewJobHandler()
	applicationHandler := handlers.NewApplicationHandler()

	v1 := r.Group("/v1")

	// Auth
	auth := v1.Group("/auth")
	auth.POST("/register", authHandler.Register)
	auth.POST("/login", authHandler.Login)

	authSecured := auth.Group("/")
	authSecured.Use(middleware.AuthMiddleware(cfg.JWTSecret))
	authSecured.POST("/logout", authHandler.Logout)
	authSecured.GET("/me", authHandler.Me)
	authSecured.POST("/change-password", authHandler.ChangePassword)

	// Profile
	profile := v1.Group("/profile")
	profile.Use(middleware.AuthMiddleware(cfg.JWTSecret))
	profile.GET("/job-seeker", middleware.RoleMiddleware("job_seeker"), profileHandler.GetJobSeekerProfile)
	profile.PUT("/job-seeker", middleware.RoleMiddleware("job_seeker"), profileHandler.UpdateJobSeekerProfile)
	profile.GET("/employer", middleware.RoleMiddleware("employer"), profileHandler.GetEmployerProfile)
	profile.PUT("/employer", middleware.RoleMiddleware("employer"), profileHandler.UpdateEmployerProfile)

	// Companies (public GET, employer-only POST/PUT)
	v1.GET("/companies/:id", companyHandler.Get)
	empCompanies := v1.Group("/companies")
	empCompanies.Use(middleware.AuthMiddleware(cfg.JWTSecret), middleware.RoleMiddleware("employer"))
	empCompanies.POST("", companyHandler.Create)
	empCompanies.PUT("/:id", companyHandler.Update)

	// Dictionaries
	v1.GET("/industries", dictionaryHandler.GetIndustries)

	// Resumes (public GET single, seeker-only for CRUD)
	v1.GET("/resumes/:id", resumeHandler.Get)
	seekerResumes := v1.Group("/resumes")
	seekerResumes.Use(middleware.AuthMiddleware(cfg.JWTSecret), middleware.RoleMiddleware("job_seeker"))
	seekerResumes.GET("", resumeHandler.GetMyResumes)
	seekerResumes.POST("", resumeHandler.Create)
	seekerResumes.PUT("/:id", resumeHandler.Update)
	seekerResumes.DELETE("/:id", resumeHandler.Delete)

	// Jobs — all wildcards use :id to avoid Gin conflicts.
	// Sub-paths /jobs/:id/applications and /jobs/:id/apply are nested under :id.
	v1.GET("/jobs", jobHandler.GetJobs)
	v1.GET("/jobs/:id", jobHandler.Get)

	empJobs := v1.Group("/jobs")
	empJobs.Use(middleware.AuthMiddleware(cfg.JWTSecret), middleware.RoleMiddleware("employer"))
	empJobs.POST("", jobHandler.Create)
	empJobs.PUT("/:id", jobHandler.Update)
	empJobs.DELETE("/:id", jobHandler.Delete)
	// Employer views applicants: GET /jobs/:id/applications
	empJobs.GET("/:id/applications", applicationHandler.GetJobApplications)

	seekerJobs := v1.Group("/jobs")
	seekerJobs.Use(middleware.AuthMiddleware(cfg.JWTSecret), middleware.RoleMiddleware("job_seeker"))
	// Job seeker applies: POST /jobs/:id/apply
	seekerJobs.POST("/:id/apply", applicationHandler.Apply)

	// Applications
	apps := v1.Group("/applications")
	apps.Use(middleware.AuthMiddleware(cfg.JWTSecret))
	apps.GET("/me", middleware.RoleMiddleware("job_seeker"), applicationHandler.GetMyApplications)
	apps.DELETE("/:id", middleware.RoleMiddleware("job_seeker"), applicationHandler.DeleteApplication)
	apps.PATCH("/:id/status", middleware.RoleMiddleware("employer"), applicationHandler.UpdateStatus)


	return r
}
