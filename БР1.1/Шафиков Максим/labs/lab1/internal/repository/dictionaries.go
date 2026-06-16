package repository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"job-search/internal/model"
)

type DictionariesRepo struct {
	pool *pgxpool.Pool
}

func (r *DictionariesRepo) ListIndustries(ctx context.Context) ([]model.Industry, error) {
	rows, err := r.pool.Query(ctx, `SELECT id, name FROM industries ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []model.Industry
	for rows.Next() {
		var i model.Industry
		if err := rows.Scan(&i.ID, &i.Name); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if items == nil {
		items = []model.Industry{}
	}
	return items, rows.Err()
}

func (r *DictionariesRepo) ListSkills(ctx context.Context, search string) ([]model.Skill, error) {
	var (
		rows pgx.Rows
		err  error
	)
	if search != "" {
		rows, err = r.pool.Query(ctx,
			`SELECT id, name FROM skills WHERE name ILIKE $1 ORDER BY name`,
			"%"+search+"%",
		)
	} else {
		rows, err = r.pool.Query(ctx, `SELECT id, name FROM skills ORDER BY name`)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []model.Skill
	for rows.Next() {
		var s model.Skill
		if err := rows.Scan(&s.ID, &s.Name); err != nil {
			return nil, err
		}
		items = append(items, s)
	}
	if items == nil {
		items = []model.Skill{}
	}
	return items, rows.Err()
}

func (r *DictionariesRepo) ListCurrencies(ctx context.Context) ([]model.Currency, error) {
	rows, err := r.pool.Query(ctx, `SELECT code, name, symbol FROM currencies ORDER BY code`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []model.Currency
	for rows.Next() {
		var c model.Currency
		if err := rows.Scan(&c.Code, &c.Name, &c.Symbol); err != nil {
			return nil, err
		}
		items = append(items, c)
	}
	if items == nil {
		items = []model.Currency{}
	}
	return items, rows.Err()
}

func (r *DictionariesRepo) GetIndustryByID(ctx context.Context, id uuid.UUID) (*model.Industry, error) {
	var i model.Industry
	err := r.pool.QueryRow(ctx, `SELECT id, name FROM industries WHERE id = $1`, id).Scan(&i.ID, &i.Name)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &i, nil
}

func (r *DictionariesRepo) GetSkillByID(ctx context.Context, id uuid.UUID) (*model.Skill, error) {
	var s model.Skill
	err := r.pool.QueryRow(ctx, `SELECT id, name FROM skills WHERE id = $1`, id).Scan(&s.ID, &s.Name)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &s, nil
}
