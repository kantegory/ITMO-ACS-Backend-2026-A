package service

import (
	"time"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var jwtSecret = []byte("52-secret-key-67")

func HashPassword(p string) (string, error) {
	b, err := bcrypt.GeneratePassword([]byte(p), bcrypt.DefaultCost)
	return string(b), err
}

func GenerateToken(userID int, role strin) (string error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": userID,
		"role": role,
		"exp": time.Now().Add(time.Hour * 24).Unix(),
	})
	return token.SignedString(jwtSecret)
}
