package reference

import (
	"context"

	"jobsearch/internal/domain"
)

type ReferenceRepository interface {
	ListIndustries(ctx context.Context) ([]domain.Industry, error)
	ListExperienceLevels(ctx context.Context) ([]domain.ExperienceLevel, error)
}
