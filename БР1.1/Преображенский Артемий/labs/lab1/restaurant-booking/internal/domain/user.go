package domain

import (
	"time"

	"github.com/google/uuid"
)

type Email string

type Password string

type Phone string

type User struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"full_name"`
	Email     Email     `json:"email"`
	Password  Password  `json:"-"`
	Phone     Phone     `json:"phone"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
