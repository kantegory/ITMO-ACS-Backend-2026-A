package routes

import (
	"net/http"

	"resume-service/internal/config"
	"resume-service/internal/handlers"

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

	resumeHandler := handlers.NewResumeHandler()
	internalHandler := handlers.NewInternalHandler()

	internal := r.Group("/internal")
	internal.GET("/resumes/:resume_id", internalHandler.GetResume)
	internal.GET("/resumes/by-owner/:user_id", internalHandler.CheckOwner)

	v1 := r.Group("/v1")
	v1.GET("/resumes/:id", resumeHandler.Get)

	seekerResumes := v1.Group("/resumes")
	seekerResumes.Use(RoleMiddleware("job_seeker"))
	seekerResumes.GET("", resumeHandler.GetMyResumes)
	seekerResumes.POST("", resumeHandler.Create)
	seekerResumes.PUT("/:id", resumeHandler.Update)
	seekerResumes.DELETE("/:id", resumeHandler.Delete)

	return r
}
