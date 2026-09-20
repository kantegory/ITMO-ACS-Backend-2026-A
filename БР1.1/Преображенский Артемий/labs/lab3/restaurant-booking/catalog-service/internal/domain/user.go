package domain

import "github.com/google/uuid"

type User struct {
	ID       uuid.UUID `json:"id"`
	FullName string    `json:"full_name"`
}
