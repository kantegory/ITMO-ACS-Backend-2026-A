package profile

import (
	"context"
	"strings"

	"github.com/google/uuid"

	"profile-service/internal/domain"
	"profile-service/pkg/apperror"
)

type CandidateRepository interface {
	Create(ctx context.Context, userID uuid.UUID, fullName string) (*domain.Candidate, error)
	ExistsByUserID(ctx context.Context, userID uuid.UUID) (bool, error)
}

type EmployerRepository interface {
	Create(ctx context.Context, userID uuid.UUID, companyName string) (*domain.Employer, error)
	ExistsByUserID(ctx context.Context, userID uuid.UUID) (bool, error)
	GetByUserID(ctx context.Context, userID uuid.UUID) (*domain.Employer, error)
	UpdateProfile(ctx context.Context, id uuid.UUID, companyName, desc, website, logo string) (*domain.Employer, error)
}

type UseCase struct {
	candidates CandidateRepository
	employers  EmployerRepository
}

func NewUseCase(candidates CandidateRepository, employers EmployerRepository) *UseCase {
	return &UseCase{candidates: candidates, employers: employers}
}

func (uc *UseCase) CreateProfile(ctx context.Context, userID uuid.UUID, role domain.Role, fullName, companyName string) error {
	switch role {
	case domain.RoleCandidate:
		if strings.TrimSpace(fullName) == "" {
			return apperror.Validation("full_name is required")
		}
		_, err := uc.candidates.Create(ctx, userID, fullName)
		return err
	case domain.RoleEmployer:
		if strings.TrimSpace(companyName) == "" {
			return apperror.Validation("company_name is required")
		}
		_, err := uc.employers.Create(ctx, userID, companyName)
		return err
	default:
		return apperror.Validation("invalid role")
	}
}

func (uc *UseCase) EmployerExists(ctx context.Context, userID uuid.UUID) (bool, error) {
	return uc.employers.ExistsByUserID(ctx, userID)
}

func (uc *UseCase) CandidateExists(ctx context.Context, userID uuid.UUID) (bool, error) {
	return uc.candidates.ExistsByUserID(ctx, userID)
}

func (uc *UseCase) GetEmployerProfile(ctx context.Context, userID uuid.UUID) (*domain.Employer, error) {
	return uc.employers.GetByUserID(ctx, userID)
}

func (uc *UseCase) UpdateEmployerProfile(ctx context.Context, userID uuid.UUID, companyName, desc, website, logo string) (*domain.Employer, error) {
	e, err := uc.employers.GetByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	return uc.employers.UpdateProfile(ctx, e.ID, companyName, desc, website, logo)
}

func (uc *UseCase) HandleUserCreated(ctx context.Context, userID uuid.UUID, role domain.Role, fullName, companyName string) error {
	switch role {
	case domain.RoleCandidate:
		name := fullName
		if name == "" {
			name = "New Candidate"
		}
		_, err := uc.candidates.Create(ctx, userID, name)
		return err
	case domain.RoleEmployer:
		name := companyName
		if name == "" {
			name = "New Company"
		}
		_, err := uc.employers.Create(ctx, userID, name)
		return err
	default:
		return nil
	}
}
