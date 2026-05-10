package domain

import (
	"strings"
	"time"
	"unicode/utf8"

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

func ValidatePhone(p Phone) error {
	s := strings.TrimSpace(string(p))
	if s == "" {
		return nil
	}
	n := utf8.RuneCountInString(s)
	if n < 6 || n > 32 {
		return ErrInvalidInput
	}
	return nil
}
