package routes

import (
	"net/http"

	"profile-service/internal/clients"
	"profile-service/internal/config"
	"profile-service/internal/handlers"

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

	authClient := clients.NewAuthClient(cfg)
	profileHandler := handlers.NewProfileHandler(authClient)
	companyHandler := handlers.NewCompanyHandler()
	internalHandler := handlers.NewInternalHandler()

	internal := r.Group("/internal")
	internal.GET("/companies/:company_id", internalHandler.GetCompany)
	internal.GET("/employers/:user_id", internalHandler.GetEmployer)
	internal.GET("/job-seekers/:user_id", internalHandler.GetJobSeeker)

	v1 := r.Group("/v1")
	v1.GET("/companies/:id", companyHandler.Get)

	profile := v1.Group("/profile")
	seeker := profile.Group("/job-seeker")
	seeker.Use(RoleMiddleware("job_seeker"))
	seeker.GET("", profileHandler.GetJobSeekerProfile)
	seeker.POST("", profileHandler.CreateOrUpdateJobSeekerProfile)
	seeker.PUT("", profileHandler.CreateOrUpdateJobSeekerProfile)

	employer := profile.Group("/employer")
	employer.Use(RoleMiddleware("employer"))
	employer.GET("", profileHandler.GetEmployerProfile)
	employer.POST("", profileHandler.CreateOrUpdateEmployerProfile)
	employer.PUT("", profileHandler.CreateOrUpdateEmployerProfile)

	companies := v1.Group("/companies")
	companies.Use(RoleMiddleware("employer"))
	companies.POST("", companyHandler.Create)
	companies.PUT("/:id", companyHandler.Update)

	return r
}
