package jwt

import (
	"time"

	jwtlib "github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type Config struct {
	Secret  []byte
	Expires time.Duration
}

func Sign(cfg Config, userID uuid.UUID) (string, error) {
	now := time.Now()
	claims := jwtlib.RegisteredClaims{
		Subject:   userID.String(),
		ExpiresAt: jwtlib.NewNumericDate(now.Add(cfg.Expires)),
		IssuedAt:  jwtlib.NewNumericDate(now),
	}
	t := jwtlib.NewWithClaims(jwtlib.SigningMethodHS256, claims)
	return t.SignedString(cfg.Secret)
}

func ParseUserID(cfg Config, tokenString string) (uuid.UUID, error) {
	t, err := jwtlib.ParseWithClaims(tokenString, &jwtlib.RegisteredClaims{}, func(t *jwtlib.Token) (interface{}, error) {
		return cfg.Secret, nil
	})
	if err != nil {
		return uuid.Nil, err
	}
	claims, ok := t.Claims.(*jwtlib.RegisteredClaims)
	if !ok || !t.Valid {
		return uuid.Nil, jwtlib.ErrTokenInvalidClaims
	}
	if claims.Subject == "" {
		return uuid.Nil, jwtlib.ErrTokenInvalidClaims
	}
	return uuid.Parse(claims.Subject)
}
