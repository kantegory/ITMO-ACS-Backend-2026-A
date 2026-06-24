package main

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"recipe-lab3/internal/common"
)

var (
	authService   = envURL("AUTH_SERVICE_URL", "http://localhost:8081")
	recipeService = envURL("RECIPE_SERVICE_URL", "http://localhost:8082")
	socialService = envURL("SOCIAL_SERVICE_URL", "http://localhost:8083")
)

type gateway struct {
	client *http.Client
}

func main() {
	gw := gateway{client: &http.Client{Timeout: 5 * time.Second}}
	router := common.NewRouter()
	router.Use(common.CORS())
	router.Any("/api/v1", gw.route)
	router.Any("/api/v1/*path", gw.route)
	router.GET("/health", gw.health)

	log.Println("api-gateway listening on :8080")
	log.Fatal(router.Run(":8080"))
}

func (gw gateway) route(c *gin.Context) {
	target := gw.targetService(c)
	if target == "" {
		common.Error(c, http.StatusNotFound, "NOT_FOUND", "route not found")
		return
	}

	userID := ""
	if gw.requiresAuth(c) {
		user, ok := gw.validateToken(c)
		if !ok {
			return
		}
		userID = strconv.Itoa(user.ID)
	}

	gw.proxy(c, target, userID)
}

func (gw gateway) health(c *gin.Context) {
	statuses := map[string]string{"api-gateway": "ok"}
	for name, address := range map[string]string{
		"auth-service":   authService + "/health",
		"recipe-service": recipeService + "/health",
		"social-service": socialService + "/health",
	} {
		resp, err := gw.client.Get(address)
		if err != nil {
			statuses[name] = "unavailable"
			continue
		}
		_ = resp.Body.Close()
		if resp.StatusCode >= 200 && resp.StatusCode < 300 {
			statuses[name] = "ok"
		} else {
			statuses[name] = "unhealthy"
		}
	}
	common.JSON(c, http.StatusOK, statuses)
}

func (gw gateway) targetService(c *gin.Context) string {
	path := c.Request.URL.Path
	if strings.HasPrefix(path, "/api/v1/auth/") || path == "/api/v1/users/me" {
		return authService
	}
	if path == "/api/v1/recipes" || path == "/api/v1/users/me/recipes" {
		return recipeService
	}
	if strings.HasPrefix(path, "/api/v1/recipes/") {
		if strings.HasSuffix(path, "/comments") || strings.HasSuffix(path, "/like") || strings.HasSuffix(path, "/save") {
			return socialService
		}
		return recipeService
	}
	if strings.HasPrefix(path, "/api/v1/comments/") ||
		path == "/api/v1/users/me/saved-recipes" ||
		isUserSocialPath(path) {
		return socialService
	}
	return ""
}

func (gw gateway) requiresAuth(c *gin.Context) bool {
	path := c.Request.URL.Path
	method := c.Request.Method
	if strings.HasPrefix(path, "/api/v1/auth/") {
		return false
	}
	if path == "/api/v1/recipes" && method == http.MethodGet {
		return false
	}
	if strings.HasPrefix(path, "/api/v1/recipes/") && method == http.MethodGet {
		return false
	}
	if isUserSocialPath(path) && method == http.MethodGet {
		return false
	}
	return true
}

func (gw gateway) validateToken(c *gin.Context) (common.User, bool) {
	req, err := http.NewRequest(http.MethodGet, authService+"/internal/auth/validate", nil)
	if err != nil {
		common.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "cannot create auth request")
		return common.User{}, false
	}
	req.Header.Set("Authorization", c.GetHeader("Authorization"))
	resp, err := gw.client.Do(req)
	if err != nil {
		common.Error(c, http.StatusBadGateway, "BAD_GATEWAY", "auth-service unavailable")
		return common.User{}, false
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		c.Status(resp.StatusCode)
		_, _ = io.Copy(c.Writer, resp.Body)
		return common.User{}, false
	}
	var user common.User
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		common.Error(c, http.StatusBadGateway, "BAD_GATEWAY", "invalid auth-service response")
		return common.User{}, false
	}
	return user, true
}

func (gw gateway) proxy(c *gin.Context, target string, userID string) {
	r := c.Request
	targetURL, err := url.Parse(target + r.URL.RequestURI())
	if err != nil {
		common.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "invalid target URL")
		return
	}
	req, err := http.NewRequest(r.Method, targetURL.String(), r.Body)
	if err != nil {
		common.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "cannot create proxy request")
		return
	}
	req.Header = r.Header.Clone()
	if userID != "" {
		req.Header.Set("X-User-ID", userID)
	}

	resp, err := gw.client.Do(req)
	if err != nil {
		common.Error(c, http.StatusBadGateway, "BAD_GATEWAY", "target service unavailable")
		return
	}
	defer resp.Body.Close()
	for key, values := range resp.Header {
		for _, value := range values {
			c.Writer.Header().Add(key, value)
		}
	}
	c.Status(resp.StatusCode)
	_, _ = io.Copy(c.Writer, resp.Body)
}

func isUserSocialPath(path string) bool {
	const prefix = "/api/v1/users/"
	if !strings.HasPrefix(path, prefix) {
		return false
	}
	parts := strings.Split(strings.Trim(strings.TrimPrefix(path, prefix), "/"), "/")
	if len(parts) != 2 {
		return false
	}
	return parts[1] == "followers" || parts[1] == "following" || parts[1] == "follow"
}

func envURL(name string, fallback string) string {
	value := strings.TrimRight(strings.TrimSpace(os.Getenv(name)), "/")
	if value == "" {
		return fallback
	}
	return value
}
