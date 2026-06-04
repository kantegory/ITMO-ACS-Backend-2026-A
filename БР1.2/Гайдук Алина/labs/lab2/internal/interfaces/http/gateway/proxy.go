package gateway

import (
	"log/slog"
	"net/http"
	"net/http/httputil"
	"net/url"

	"recipehub/internal/api"
)

func newReverseProxy(name, rawURL string) http.Handler {
	target, err := url.Parse(rawURL)
	if err != nil || target.Scheme == "" || target.Host == "" {
		return http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			api.RespondError(w, http.StatusBadGateway, "bad_gateway", "upstream is not configured")
		})
	}

	proxy := httputil.NewSingleHostReverseProxy(target)
	director := proxy.Director
	proxy.Director = func(r *http.Request) {
		forwardedHost := r.Host
		forwardedProto := "http"
		if r.TLS != nil {
			forwardedProto = "https"
		}

		director(r)
		r.Host = target.Host
		r.Header.Set("X-Forwarded-Host", forwardedHost)
		r.Header.Set("X-Forwarded-Proto", forwardedProto)
	}
	proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
		slog.Warn("gateway upstream error", "upstream", name, "path", r.URL.Path, "error", err)
		api.RespondError(w, http.StatusBadGateway, "bad_gateway", "upstream is unavailable")
	}

	return proxy
}
