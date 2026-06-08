package gateway

import (
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"

	"job-search-microservices/internal/platform"
)

type Config struct {
	AuthURL      string
	CatalogURL   string
	ApplicantURL string
	EmployerURL  string
}

type Gateway struct {
	auth      *httputil.ReverseProxy
	catalog   *httputil.ReverseProxy
	applicant *httputil.ReverseProxy
	employer  *httputil.ReverseProxy
}

func New(config Config) (*Gateway, error) {
	authProxy, err := proxy(config.AuthURL)
	if err != nil {
		return nil, err
	}
	catalogProxy, err := proxy(config.CatalogURL)
	if err != nil {
		return nil, err
	}
	applicantProxy, err := proxy(config.ApplicantURL)
	if err != nil {
		return nil, err
	}
	employerProxy, err := proxy(config.EmployerURL)
	if err != nil {
		return nil, err
	}

	return &Gateway{
		auth:      authProxy,
		catalog:   catalogProxy,
		applicant: applicantProxy,
		employer:  employerProxy,
	}, nil
}

func (gateway *Gateway) Handler() http.Handler {
	return gateway
}

func (gateway *Gateway) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	platform.CORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	if r.URL.Path == "/health" || r.URL.Path == "/api/v1/health" {
		platform.WriteJSON(w, http.StatusOK, map[string]string{"service": "gateway", "status": "ok"})
		return
	}

	if !strings.HasPrefix(r.URL.Path, "/api/v1") {
		platform.WriteError(w, platform.NotFound("route not found"))
		return
	}

	path := strings.TrimPrefix(r.URL.Path, "/api/v1")
	if path == "" {
		path = "/"
	}
	if path != "/" {
		path = strings.TrimRight(path, "/")
	}

	r.URL.Path = path
	parts := platform.SplitPath(path)

	switch {
	case len(parts) > 0 && parts[0] == "auth":
		gateway.auth.ServeHTTP(w, r)
	case path == "/skills" || path == "/industries":
		gateway.catalog.ServeHTTP(w, r)
	case len(parts) > 0 && parts[0] == "vacancies":
		if len(parts) == 3 && parts[2] == "applications" {
			gateway.applicant.ServeHTTP(w, r)
			return
		}
		gateway.catalog.ServeHTTP(w, r)
	case len(parts) > 0 && parts[0] == "applicant":
		gateway.applicant.ServeHTTP(w, r)
	case len(parts) > 0 && parts[0] == "employer":
		gateway.employer.ServeHTTP(w, r)
	default:
		platform.WriteError(w, platform.NotFound("route not found"))
	}
}

func proxy(rawURL string) (*httputil.ReverseProxy, error) {
	target, err := url.Parse(strings.TrimRight(rawURL, "/"))
	if err != nil {
		return nil, err
	}

	reverseProxy := httputil.NewSingleHostReverseProxy(target)
	originalDirector := reverseProxy.Director
	reverseProxy.Director = func(r *http.Request) {
		originalDirector(r)
		r.Host = target.Host
	}
	return reverseProxy, nil
}
