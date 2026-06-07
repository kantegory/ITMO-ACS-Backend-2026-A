package auth

import (
	"context"

	"github.com/google/uuid"

	"auth-service/internal/domain"
)

type UserRepository interface {
	Create(ctx context.Context, email, passwordHash string, role domain.Role) (*domain.User, error)
	DeleteByID(ctx context.Context, id uuid.UUID) error
	GetByEmail(ctx context.Context, email string) (*domain.User, error)
	GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error)
}

type ProfileClient interface {
	CreateProfile(ctx context.Context, userID uuid.UUID, role domain.Role, fullName, companyName string) error
}

type EventPublisher interface {
	UserCreated(ctx context.Context, userID uuid.UUID, email string, role domain.Role) error
}

type TokenProvider interface {
	Generate(userID uuid.UUID, role domain.Role) (string, error)
	Parse(token string) (uuid.UUID, domain.Role, error)
}
