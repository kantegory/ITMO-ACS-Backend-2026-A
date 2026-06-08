package database

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"

	"vacancy-service/internal/domain"
	"vacancy-service/pkg/apperror"
)

type ReferenceRepository struct {
	pool *pgxpool.Pool
}

func NewReferenceRepository(pool *pgxpool.Pool) *ReferenceRepository {
	return &ReferenceRepository{pool: pool}
}

func (r *ReferenceRepository) ListIndustries(ctx context.Context) ([]domain.Industry, error) {
	rows, err := r.pool.Query(ctx, `SELECT id, name, slug FROM industries ORDER BY name`)
	if err != nil {
		return nil, apperror.Internal(err)
	}
	defer rows.Close()
	var list []domain.Industry
	for rows.Next() {
		var i domain.Industry
		if err := rows.Scan(&i.ID, &i.Name, &i.Slug); err != nil {
			return nil, apperror.Internal(err)
		}
		list = append(list, i)
	}
	return list, nil
}

func (r *ReferenceRepository) ListExperienceLevels(ctx context.Context) ([]domain.ExperienceLevel, error) {
	rows, err := r.pool.Query(ctx, `SELECT id, name, slug, min_years, max_years FROM experience_levels ORDER BY min_years`)
	if err != nil {
		return nil, apperror.Internal(err)
	}
	defer rows.Close()
	var list []domain.ExperienceLevel
	for rows.Next() {
		var e domain.ExperienceLevel
		if err := rows.Scan(&e.ID, &e.Name, &e.Slug, &e.MinYears, &e.MaxYears); err != nil {
			return nil, apperror.Internal(err)
		}
		list = append(list, e)
	}
	return list, nil
}

func (r *ReferenceRepository) IndustryExists(ctx context.Context, id interface{}) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM industries WHERE id = $1)`, id).Scan(&exists)
	return exists, err
}

func (r *ReferenceRepository) ExperienceLevelExists(ctx context.Context, id interface{}) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM experience_levels WHERE id = $1)`, id).Scan(&exists)
	return exists, err
}
