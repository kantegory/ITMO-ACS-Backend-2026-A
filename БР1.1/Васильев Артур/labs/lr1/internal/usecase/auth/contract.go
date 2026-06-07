package auth

import (
	"context"

	"github.com/google/uuid"

	"jobsearch/internal/domain"
)

type UserRepository interface {
	Create(ctx context.Context, email, passwordHash string, role domain.Role) (*domain.User, error)
	DeleteByID(ctx context.Context, id uuid.UUID) error
	GetByEmail(ctx context.Context, email string) (*domain.User, error)
	GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error)
}

type CandidateRepository interface {
	Create(ctx context.Context, userID uuid.UUID, fullName string) (*domain.Candidate, error)
}

type EmployerRepository interface {
	Create(ctx context.Context, userID uuid.UUID, companyName string) (*domain.Employer, error)
}

type TokenProvider interface {
	Generate(userID uuid.UUID, role domain.Role) (string, error)
	Parse(token string) (uuid.UUID, domain.Role, error)
}
