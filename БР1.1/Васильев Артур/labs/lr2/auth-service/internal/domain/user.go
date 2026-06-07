package domain

import (
	"time"

	"github.com/google/uuid"
)

type Role string

const (
	RoleCandidate Role = "candidate"
	RoleEmployer  Role = "employer"
)

type User struct {
	ID           uuid.UUID
	Email        string
	PasswordHash string
	Role         Role
	CreatedAt    time.Time
	UpdatedAt    time.Time
}
