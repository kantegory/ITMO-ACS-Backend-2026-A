package utils

import (
	"auth-service/internal/config"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID uint   `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func GenerateToken(userID uint, email string, role string, secret string, expiry time.Duration) (string, error) {
	claims := Claims{
		UserID: userID,
		Email:  email,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func GenerateTokenPair(userID uint, email string, role string, cfg *config.Config) (string, string, error) {
	accessExpire, _ := time.ParseDuration(cfg.JWTAccessExpire)
	refreshExpire, _ := time.ParseDuration(cfg.JWTRefreshExpire)

	accessToken, err := GenerateToken(userID, email, role, cfg.JWTSecret, accessExpire)
	if err != nil {
		return "", "", err
	}
	refreshToken, err := GenerateToken(userID, email, role, cfg.JWTSecret, refreshExpire)
	if err != nil {
		return "", "", err
	}
	return accessToken, refreshToken, nil
}

func ValidateToken(tokenString string, secret string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}
	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}
	return nil, jwt.ErrTokenInvalidClaims
}