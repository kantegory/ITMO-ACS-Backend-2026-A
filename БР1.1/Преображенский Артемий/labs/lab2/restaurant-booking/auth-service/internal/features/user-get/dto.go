package userget

import (
	"github.com/google/uuid"

	"restaurant-booking/auth-service/internal/domain"
)

type Input struct {
	UserID uuid.UUID
}

type Output struct {
	User domain.User
}
