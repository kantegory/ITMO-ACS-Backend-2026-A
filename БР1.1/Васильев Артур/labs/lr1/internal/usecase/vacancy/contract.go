package vacancy

import (
	"context"

	"github.com/google/uuid"

	"jobsearch/internal/domain"
)

type VacancyRepository interface {
	GetByID(ctx context.Context, id uuid.UUID) (*domain.VacancyDetail, error)
	List(ctx context.Context, f domain.VacancyFilter) (*domain.PaginatedVacancies, error)
}
