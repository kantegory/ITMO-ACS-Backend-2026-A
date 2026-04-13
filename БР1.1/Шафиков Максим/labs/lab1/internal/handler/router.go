package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"job-search/internal/middleware"
	"job-search/internal/repository"
)

const swaggerHTML = `<!DOCTYPE html>
<html>
<head>
  <title>Job Search API Docs</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
<div id="swagger-ui"></div>
<script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
<script>
SwaggerUIBundle({
  url: "/openapi.yaml",
  dom_id: '#swagger-ui',
  deepLinking: true,
  presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
  layout: "BaseLayout"
})
</script>
</body>
</html>`

func errorResponse(c *gin.Context, statusCode int, errorCode, message string) {
	c.JSON(statusCode, gin.H{
		"error":   errorCode,
		"message": message,
	})
}

func SetupRouter(repos *repository.Repositories, jwtSecret string) *gin.Engine {
	router := gin.Default()

	authH := &AuthHandler{repos: repos, jwtSecret: jwtSecret}
	dictH := &DictionariesHandler{repos: repos}
	vacH := &VacanciesHandler{repos: repos}
	resH := &ResumesHandler{repos: repos}
	appH := &ApplicationsHandler{repos: repos}
	profH := &ProfilesHandler{repos: repos}

	authMW := middleware.AuthMiddleware(jwtSecret)

	// Docs
	router.GET("/docs/", func(c *gin.Context) {
		c.Header("Content-Type", "text/html; charset=utf-8")
		c.String(http.StatusOK, swaggerHTML)
	})
	router.GET("/openapi.yaml", func(c *gin.Context) {
		c.File("openapi.yaml")
	})

	v1 := router.Group("/v1")
	{
		// Auth
		auth := v1.Group("/auth")
		{
			auth.POST("/register", authH.Register)
			auth.POST("/login", authH.Login)
		}

		// Dictionaries
		v1.GET("/industries", dictH.ListIndustries)
		v1.GET("/skills", dictH.ListSkills)
		v1.GET("/currencies", dictH.ListCurrencies)

		// Vacancies
		vacancies := v1.Group("/vacancies")
		{
			vacancies.GET("", vacH.List)
			vacancies.POST("", authMW, vacH.Create)
			vacancies.GET("/:id", vacH.GetByID)
			vacancies.PATCH("/:id", authMW, vacH.Update)
			vacancies.DELETE("/:id", authMW, vacH.Delete)
			vacancies.POST("/:id/apply", authMW, appH.Apply)
		}

		// Resumes
		resumes := v1.Group("/resumes")
		{
			resumes.GET("", authMW, resH.List)
			resumes.POST("", authMW, resH.Create)
			resumes.GET("/:id", authMW, resH.GetByID)
			resumes.PATCH("/:id", authMW, resH.Update)
			resumes.DELETE("/:id", authMW, resH.Delete)
		}

		// Applications
		applications := v1.Group("/applications")
		{
			applications.GET("", authMW, appH.List)
			applications.GET("/:id", authMW, appH.GetByID)
			applications.PATCH("/:id", authMW, appH.UpdateStatus)
			applications.DELETE("/:id", authMW, appH.Delete)
		}

		// Profiles
		profiles := v1.Group("/profiles")
		{
			profiles.GET("/me", authMW, profH.GetMe)
			profiles.PUT("/company", authMW, profH.UpsertCompany)
		}
	}

	return router
}
