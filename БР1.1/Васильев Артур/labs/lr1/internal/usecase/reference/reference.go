package reference

import (
	"context"

	"jobsearch/internal/domain"
)

type UseCase struct {
	repo ReferenceRepository
}

func NewUseCase(repo ReferenceRepository) *UseCase {
	return &UseCase{repo: repo}
}

func (uc *UseCase) ListIndustries(ctx context.Context) ([]domain.Industry, error) {
	return uc.repo.ListIndustries(ctx)
}

func (uc *UseCase) ListExperienceLevels(ctx context.Context) ([]domain.ExperienceLevel, error) {
	return uc.repo.ListExperienceLevels(ctx)
}
