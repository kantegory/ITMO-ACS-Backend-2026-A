package models

import "time"

type User struct {
	ID int `db:"id" json:"id"`
	Email string `db:"email" json:"email"`
	PasswordHash string `db:"password_hash" json:"-"`
	FullName string `db:"full_name" json:"full_name"`
	Phone string `db:"phone" json:"phone"`
	Role string `db:"role" json:"role"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}

type RegisterReq struct {
	Email string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
	FullName string `json:"full_name" validate:"required"`
	Phone string `json:"phone" validate:"required"`
}

type LoginReq struct {
	Email string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type AuthResponse struct {
	AccessToken string `json:"access_token"`
	User User `json:"user"`
}
