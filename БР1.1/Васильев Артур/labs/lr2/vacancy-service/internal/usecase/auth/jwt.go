package auth

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"

	"vacancy-service/internal/domain"
	"vacancy-service/pkg/apperror"
)

type TokenProvider interface {
	Parse(token string) (uuid.UUID, domain.Role, error)
}

type JWTProvider struct {
	secret []byte
}

func NewJWTProvider(secret string) *JWTProvider {
	return &JWTProvider{secret: []byte(secret)}
}

type claims struct {
	UserID uuid.UUID   `json:"uid"`
	Role   domain.Role `json:"role"`
	jwt.RegisteredClaims
}

func (p *JWTProvider) Parse(tokenStr string) (uuid.UUID, domain.Role, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &claims{}, func(t *jwt.Token) (any, error) {
		return p.secret, nil
	})
	if err != nil || !token.Valid {
		return uuid.Nil, "", apperror.Unauthorized("invalid token")
	}
	c, ok := token.Claims.(*claims)
	if !ok {
		return uuid.Nil, "", apperror.Unauthorized("invalid token")
	}
	_ = time.Now()
	return c.UserID, c.Role, nil
}
