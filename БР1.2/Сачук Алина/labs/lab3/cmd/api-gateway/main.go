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
	mux := http.NewServeMux()
	mux.HandleFunc("/api/v1/", gw.route)
	mux.HandleFunc("/health", gw.health)

	log.Println("api-gateway listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}

func (gw gateway) route(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
	if r.Method == http.MethodOptions {
		common.Empty(w, http.StatusNoContent)
		return
	}

	target := gw.targetService(r)
	if target == "" {
		common.Error(w, http.StatusNotFound, "NOT_FOUND", "route not found")
		return
	}

	userID := ""
	if gw.requiresAuth(r) {
		user, ok := gw.validateToken(w, r)
		if !ok {
			return
		}
		userID = intToString(user.ID)
	}

	gw.proxy(w, r, target, userID)
}

func (gw gateway) health(w http.ResponseWriter, r *http.Request) {
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
	common.JSON(w, http.StatusOK, statuses)
}

func (gw gateway) targetService(r *http.Request) string {
	path := r.URL.Path
	if strings.HasPrefix(path, "/api/v1/auth/") || path == "/api/v1/users/me" {
		return authService
	}
	if path == "/api/v1/recipes" || strings.HasPrefix(path, "/api/v1/users/me/recipes") {
		return recipeService
	}
	if strings.HasPrefix(path, "/api/v1/recipes/") {
		if strings.HasSuffix(path, "/comments") || strings.HasSuffix(path, "/like") || strings.HasSuffix(path, "/save") {
			return socialService
		}
		return recipeService
	}
	if strings.HasPrefix(path, "/api/v1/comments/") ||
		strings.HasPrefix(path, "/api/v1/users/me/saved-recipes") ||
		isUserSocialPath(path) {
		return socialService
	}
	return ""
}

func (gw gateway) requiresAuth(r *http.Request) bool {
	path := r.URL.Path
	if strings.HasPrefix(path, "/api/v1/auth/") {
		return false
	}
	if path == "/api/v1/recipes" && r.Method == http.MethodGet {
		return false
	}
	if strings.HasPrefix(path, "/api/v1/recipes/") && r.Method == http.MethodGet {
		return false
	}
	if isUserSocialPath(path) && r.Method == http.MethodGet {
		return false
	}
	return true
}

func (gw gateway) validateToken(w http.ResponseWriter, r *http.Request) (common.User, bool) {
	req, err := http.NewRequest(http.MethodGet, authService+"/internal/auth/validate", nil)
	if err != nil {
		common.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "cannot create auth request")
		return common.User{}, false
	}
	req.Header.Set("Authorization", r.Header.Get("Authorization"))
	resp, err := gw.client.Do(req)
	if err != nil {
		common.Error(w, http.StatusBadGateway, "BAD_GATEWAY", "auth-service unavailable")
		return common.User{}, false
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		w.WriteHeader(resp.StatusCode)
		_, _ = io.Copy(w, resp.Body)
		return common.User{}, false
	}
	var user common.User
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		common.Error(w, http.StatusBadGateway, "BAD_GATEWAY", "invalid auth-service response")
		return common.User{}, false
	}
	return user, true
}

func (gw gateway) proxy(w http.ResponseWriter, r *http.Request, target string, userID string) {
	targetURL, err := url.Parse(target + r.URL.RequestURI())
	if err != nil {
		common.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "invalid target URL")
		return
	}
	req, err := http.NewRequest(r.Method, targetURL.String(), r.Body)
	if err != nil {
		common.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "cannot create proxy request")
		return
	}
	req.Header = r.Header.Clone()
	if userID != "" {
		req.Header.Set("X-User-ID", userID)
	}

	resp, err := gw.client.Do(req)
	if err != nil {
		common.Error(w, http.StatusBadGateway, "BAD_GATEWAY", "target service unavailable")
		return
	}
	defer resp.Body.Close()
	for key, values := range resp.Header {
		for _, value := range values {
			w.Header().Add(key, value)
		}
	}
	w.WriteHeader(resp.StatusCode)
	_, _ = io.Copy(w, resp.Body)
}

func isUserSocialPath(path string) bool {
	return strings.Contains(path, "/followers") ||
		strings.Contains(path, "/following") ||
		strings.HasSuffix(path, "/follow")
}

func intToString(value int) string {
	return strconv.Itoa(value)
}

func envURL(name string, fallback string) string {
	value := strings.TrimRight(strings.TrimSpace(os.Getenv(name)), "/")
	if value == "" {
		return fallback
	}
	return value
}
