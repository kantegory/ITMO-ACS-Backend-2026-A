package model

import "time"

type User struct {
	ID int `db:"id" json:"id"`
	Email string `db:"email" json:"email"`
	PasswordHash string `db"password_hash" json:"-"`
	FullName string `db:"full_name" json:"full_name"`
	Phone string `db:"phone" json:"phone"`
	Role string `db:"role" json:"role"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}

type RegisterReq struct {
	Email string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	ConfirmPassword string `json:"confirm_password" binding:"required,eqfield=Password"`
	FullName string `json:"full_name" binding:"required"`
	Phone string `json:"phone" binding:"required"`
}
