package register

import "restaurant-booking/internal/domain"

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
