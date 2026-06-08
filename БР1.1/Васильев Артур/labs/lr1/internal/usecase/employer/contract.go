package employer

import (
	"context"

	"github.com/google/uuid"

	"jobsearch/internal/domain"
)

type EmployerRepository interface {
	GetByUserID(ctx context.Context, userID uuid.UUID) (*domain.Employer, error)
	UpdateProfile(ctx context.Context, id uuid.UUID, companyName, desc, website, logo string) (*domain.Employer, error)
}

type VacancyRepository interface {
	Create(ctx context.Context, v domain.Vacancy) (*domain.VacancyDetail, error)
	GetByID(ctx context.Context, id uuid.UUID) (*domain.VacancyDetail, error)
	Update(ctx context.Context, id uuid.UUID, v domain.Vacancy) (*domain.VacancyDetail, error)
	Delete(ctx context.Context, id uuid.UUID) error
	SetPublished(ctx context.Context, id uuid.UUID, published bool) (*domain.VacancyDetail, error)
	List(ctx context.Context, f domain.VacancyFilter) (*domain.PaginatedVacancies, error)
	GetEmployerID(ctx context.Context, vacancyID uuid.UUID) (uuid.UUID, error)
}

type ReferenceRepository interface {
	IndustryExists(ctx context.Context, id interface{}) (bool, error)
	ExperienceLevelExists(ctx context.Context, id interface{}) (bool, error)
}
