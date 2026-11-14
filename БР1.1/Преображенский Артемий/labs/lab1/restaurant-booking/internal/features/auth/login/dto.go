package login

import "restaurant-booking/internal/domain"

type Input struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type Output struct {
	Token string      `json:"token"`
	User  domain.User `json:"user"`
}
