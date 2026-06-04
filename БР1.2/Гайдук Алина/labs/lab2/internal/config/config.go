package config

import (
	"os"
	"strconv"
	"strings"
)

// defaultDatabaseURL при отсутствии DATABASE_URL: Postgres из compose на хосте (порт по умолчанию 5433, см. compose.yaml).
const defaultDatabaseURL = "postgres://recipehub:recipehub@127.0.0.1:5433/recipehub?sslmode=disable"

type Config struct {
	Addr              string
	DatabaseURL       string
	JWTAccessSecret   string
	JWTRefreshSecret  string
	AccessTTLSeconds  int
	RefreshTTLSeconds int
}

type ServiceConfig struct {
	Name              string
	Addr              string
	DatabaseURL       string
	JWTAccessSecret   string
	JWTRefreshSecret  string
	AccessTTLSeconds  int
	RefreshTTLSeconds int
	ServiceToken      string
}

func Load() Config {
	return Config{
		Addr:              cmpOr(os.Getenv("HTTP_ADDR"), ":8080"),
		DatabaseURL:       cmpOr(os.Getenv("DATABASE_URL"), defaultDatabaseURL),
		JWTAccessSecret:   cmpOr(os.Getenv("JWT_ACCESS_SECRET"), "dev-access-secret-change-me"),
		JWTRefreshSecret:  cmpOr(os.Getenv("JWT_REFRESH_SECRET"), "dev-refresh-secret-change-me"),
		AccessTTLSeconds:  atoiDef(os.Getenv("JWT_ACCESS_TTL_SEC"), 3600),
		RefreshTTLSeconds: atoiDef(os.Getenv("JWT_REFRESH_TTL_SEC"), 60*60*24*7),
	}
}

func LoadService(name, defaultAddr string) ServiceConfig {
	prefix := serviceEnvPrefix(name)

	return ServiceConfig{
		Name:              name,
		Addr:              firstNonEmpty(os.Getenv(prefix+"_HTTP_ADDR"), os.Getenv("HTTP_ADDR"), defaultAddr),
		DatabaseURL:       firstNonEmpty(os.Getenv(prefix+"_DATABASE_URL"), os.Getenv("DATABASE_URL"), defaultDatabaseURL),
		JWTAccessSecret:   cmpOr(os.Getenv("JWT_ACCESS_SECRET"), "dev-access-secret-change-me"),
		JWTRefreshSecret:  cmpOr(os.Getenv("JWT_REFRESH_SECRET"), "dev-refresh-secret-change-me"),
		AccessTTLSeconds:  atoiDef(os.Getenv("JWT_ACCESS_TTL_SEC"), 3600),
		RefreshTTLSeconds: atoiDef(os.Getenv("JWT_REFRESH_TTL_SEC"), 60*60*24*7),
		ServiceToken:      cmpOr(os.Getenv("SERVICE_TOKEN"), "dev-service-token-change-me"),
	}
}

func serviceEnvPrefix(name string) string {
	replacer := strings.NewReplacer("-", "_", ".", "_")
	return strings.ToUpper(replacer.Replace(strings.TrimSpace(name)))
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if trimmed := strings.TrimSpace(value); trimmed != "" {
			return trimmed
		}
	}
	return ""
}

func cmpOr(a, b string) string {
	if t := strings.TrimSpace(a); t != "" {
		return t
	}
	return b
}

func atoiDef(s string, def int) int {
	s = strings.TrimSpace(s)
	if s == "" {
		return def
	}
	n, err := strconv.Atoi(s)
	if err != nil {
		return def
	}
	return n
}
