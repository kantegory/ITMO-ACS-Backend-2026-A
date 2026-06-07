package vacancy

import (
	"context"

	"github.com/google/uuid"

	"jobsearch/internal/domain"
	"jobsearch/pkg/apperror"
)

type UseCase struct {
	vacancies VacancyRepository
}

func NewUseCase(vacancies VacancyRepository) *UseCase {
	return &UseCase{vacancies: vacancies}
}

func (uc *UseCase) Search(ctx context.Context, f domain.VacancyFilter) (*domain.PaginatedVacancies, error) {
	f.OnlyPublished = true
	if f.Page < 1 {
		f.Page = 1
	}
	if f.Limit < 1 {
		f.Limit = 20
	}
	return uc.vacancies.List(ctx, f)
}

func (uc *UseCase) GetPublic(ctx context.Context, id uuid.UUID) (*domain.VacancyDetail, error) {
	v, err := uc.vacancies.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if !v.IsPublished {
		return nil, apperror.NotFound("vacancy not found")
	}
	return v, nil
}
