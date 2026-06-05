package httpserver

import (
	_ "embed"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

//go:embed swagger_ui/index.html
var swaggerUIPage []byte

func mountSwagger(r chiRouter) {
	r.Get("/swagger", func(w http.ResponseWriter, req *http.Request) {
		http.Redirect(w, req, "/swagger/", http.StatusPermanentRedirect)
	})
	r.Get("/swagger/", serveSwaggerHTML)
	r.Get("/swagger/openapi.yaml", serveOpenAPISpecYAML)
}

func serveSwaggerHTML(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(swaggerUIPage)
}

func serveOpenAPISpecYAML(w http.ResponseWriter, _ *http.Request) {
	path := openAPIYAMLPath()
	data, err := os.ReadFile(path)
	if err != nil {
		http.Error(w, "openapi spec not found (expected "+path+")", http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/yaml; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(data)
}

// openAPIYAMLPath возвращает путь к файлу спецификации: переменная OPENAPI_SPEC_PATH или файл docs/openapi.yaml относительно рабочего каталога процесса.
func openAPIYAMLPath() string {
	if p := strings.TrimSpace(os.Getenv("OPENAPI_SPEC_PATH")); p != "" {
		return p
	}
	return filepath.Join("docs", "openapi.yaml")
}

// chiRouter минимальный интерфейс регистрации GET, который нужен от chi.Router в этом модуле.
type chiRouter interface {
	Get(pattern string, h http.HandlerFunc)
}
