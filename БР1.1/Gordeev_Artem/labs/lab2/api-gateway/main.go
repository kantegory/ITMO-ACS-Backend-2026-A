package main

import (
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
)

type JWTClaims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

func reverseProxy(target string) *httputil.ReverseProxy {
	url, err := url.Parse(target)
	if err != nil {
		log.Fatalf("Invalid target URL: %v", err)
	}
	return httputil.NewSingleHostReverseProxy(url)
}

func authMiddleware(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if !(len(parts) == 2 && parts[0] == "Bearer") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Формат заголовка авторизации должен быть Bearer {token}"})
			c.Abort()
			return
		}

		claims := &JWTClaims{}
		token, err := jwt.ParseWithClaims(parts[1], claims, func(token *jwt.Token) (interface{}, error) {
			return []byte(secret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверный или просроченный токен"})
			c.Abort()
			return
		}

		c.Request.Header.Set("X-User-ID", claims.UserID)
		c.Request.Header.Set("X-User-Role", claims.Role)

		c.Next()
	}
}

func proxyHandler(proxy *httputil.ReverseProxy) gin.HandlerFunc {
	return func(c *gin.Context) {
		proxy.ServeHTTP(c.Writer, c.Request)
	}
}

func main() {
	godotenv.Load()

	port := getEnv("PORT", "8080")
	jwtSecret := getEnv("JWT_SECRET", "supersecretkey")

	authURL := getEnv("AUTH_SERVICE_URL", "http://auth-service:8081")
	profileURL := getEnv("PROFILE_SERVICE_URL", "http://profile-service:8082")
	resumeURL := getEnv("RESUME_SERVICE_URL", "http://resume-service:8083")
	jobURL := getEnv("JOB_SERVICE_URL", "http://job-service:8084")

	authProxy := reverseProxy(authURL)
	profileProxy := reverseProxy(profileURL)
	resumeProxy := reverseProxy(resumeURL)
	jobProxy := reverseProxy(jobURL)

	r := gin.Default()
	r.Use(authMiddleware(jwtSecret))

	v1 := r.Group("/v1")

	v1.Any("/auth/*filepath", proxyHandler(authProxy))

	v1.Any("/profile/*filepath", proxyHandler(profileProxy))
	v1.Any("/companies", proxyHandler(profileProxy))
	v1.Any("/companies/*filepath", proxyHandler(profileProxy))

	v1.Any("/resumes", proxyHandler(resumeProxy))
	v1.Any("/resumes/*filepath", proxyHandler(resumeProxy))

	v1.Any("/jobs", proxyHandler(jobProxy))
	v1.Any("/jobs/*filepath", proxyHandler(jobProxy))
	v1.Any("/applications", proxyHandler(jobProxy))
	v1.Any("/applications/*filepath", proxyHandler(jobProxy))
	v1.Any("/industries", proxyHandler(jobProxy))
	v1.Any("/industries/*filepath", proxyHandler(jobProxy))

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	log.Printf("API Gateway starting on port %s", port)
	if err := r.Run(fmt.Sprintf(":%s", port)); err != nil {
		log.Fatalf("Failed to run API Gateway: %v", err)
	}
}
