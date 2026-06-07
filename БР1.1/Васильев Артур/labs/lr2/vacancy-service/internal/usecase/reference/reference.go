package reference

import (
	"context"

	"vacancy-service/internal/domain"
)

type ReferenceRepository interface {
	ListIndustries(ctx context.Context) ([]domain.Industry, error)
	ListExperienceLevels(ctx context.Context) ([]domain.ExperienceLevel, error)
}

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
