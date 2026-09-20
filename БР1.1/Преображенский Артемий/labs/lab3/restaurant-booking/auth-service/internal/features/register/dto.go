package register

import (
	"github.com/google/uuid"

	"restaurant-booking/auth-service/internal/domain"
)

type User struct {
	ID       uuid.UUID `json:"id"`
	FullName string    `json:"full_name"`
}

type Input struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	FullName string `json:"full_name"`
	Phone    string `json:"phone"`
}

type Output struct {
	Token string      `json:"token"`
	User  domain.User `json:"user"`
}
