package jwt

import (
	"github.com/golang-jwt/jwt/v5"
)

const (
	ContextUserIDKey = "user_id"
	ContextUserRole  = "user_role"
)

type Role string

const (
	RoleTenant   Role = "TENANT"
	RoleLandlord Role = "LANDLORD"
	RoleBoth     Role = "BOTH"
)

func (r Role) IsValid() bool {
	switch r {
	case RoleTenant, RoleLandlord, RoleBoth:
		return true
	default:
		return false
	}
}

type Claims struct {
	UserID uint `json:"user_id"`
	Role   Role `json:"role"`
	jwt.RegisteredClaims
}
