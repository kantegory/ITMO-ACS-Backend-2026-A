package middleware

import (
	"api-gateway/internal/utils"
)

func validateTokenLocally(tokenString string, secret string) (*utils.Claims, error) {
	return utils.ValidateToken(tokenString, secret)
}