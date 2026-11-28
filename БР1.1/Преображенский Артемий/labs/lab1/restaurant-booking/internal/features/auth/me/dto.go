package me

import (
	"github.com/google/uuid"

	"restaurant-booking/internal/domain"
)

type Input struct {
	UserID uuid.UUID
}

type Output struct {
	User domain.User
}
