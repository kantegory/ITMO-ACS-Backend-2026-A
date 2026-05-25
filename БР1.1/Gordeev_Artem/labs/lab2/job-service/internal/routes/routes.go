package routes

import (
	"net/http"

	"job-service/internal/clients"
	"job-service/internal/config"
	"job-service/internal/handlers"

	"github.com/gin-gonic/gin"
)

func RoleMiddleware(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole := c.GetHeader("X-User-Role")
		if userRole == "" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Запрещено: роль не найдена"})
			c.Abort()
			return
		}

		allowed := false
		for _, role := range roles {
			if userRole == role {
				allowed = true
				break
			}
		}

		if !allowed {
			c.JSON(http.StatusForbidden, gin.H{"error": "Запрещено: недостаточно прав"})
			c.Abort()
			return
		}

		c.Next()
	}
}

func SetupRouter(cfg *config.Config) *gin.Engine {
	r := gin.Default()

	profileClient := clients.NewProfileClient(cfg)
	resumeClient := clients.NewResumeClient(cfg)

	jobHandler := handlers.NewJobHandler(profileClient)
	applicationHandler := handlers.NewApplicationHandler(resumeClient)
	dictionaryHandler := handlers.NewDictionaryHandler()

	v1 := r.Group("/v1")

	v1.GET("/industries", dictionaryHandler.GetIndustries)

	v1.GET("/jobs", jobHandler.GetJobs)
	v1.GET("/jobs/:id", jobHandler.Get)

	empJobs := v1.Group("/jobs")
	empJobs.Use(RoleMiddleware("employer"))
	empJobs.POST("", jobHandler.Create)
	empJobs.PUT("/:id", jobHandler.Update)
	empJobs.DELETE("/:id", jobHandler.Delete)
	empJobs.GET("/:id/applications", applicationHandler.GetJobApplications)

	seekerJobs := v1.Group("/jobs")
	seekerJobs.Use(RoleMiddleware("job_seeker"))
	seekerJobs.POST("/:id/apply", applicationHandler.Apply)

	apps := v1.Group("/applications")
	apps.GET("/me", RoleMiddleware("job_seeker"), applicationHandler.GetMyApplications)
	apps.DELETE("/:id", RoleMiddleware("job_seeker"), applicationHandler.DeleteApplication)
	apps.PATCH("/:id/status", RoleMiddleware("employer"), applicationHandler.UpdateStatus)

	return r
}
