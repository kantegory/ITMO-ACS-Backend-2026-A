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
