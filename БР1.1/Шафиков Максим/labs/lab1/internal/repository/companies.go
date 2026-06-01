package repository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"job-search/internal/model"
)

type CompaniesRepo struct {
	pool *pgxpool.Pool
}

func (r *CompaniesRepo) GetByUserID(ctx context.Context, userID uuid.UUID) (*model.Company, error) {
	var c model.Company
	var indID *uuid.UUID
	var indName *string

	err := r.pool.QueryRow(ctx,
		`SELECT c.id, c.user_id, c.name, c.description, c.location, c.created_at,
		        i.id, i.name
		 FROM companies c
		 LEFT JOIN industries i ON i.id = c.industry_id
		 WHERE c.user_id = $1`,
		userID,
	).Scan(&c.ID, &c.UserID, &c.Name, &c.Description, &c.Location, &c.CreatedAt,
		&indID, &indName)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if indID != nil && indName != nil {
		c.Industry = &model.Industry{ID: *indID, Name: *indName}
	}
	return &c, nil
}

func (r *CompaniesRepo) GetByID(ctx context.Context, id uuid.UUID) (*model.Company, error) {
	var c model.Company
	var indID *uuid.UUID
	var indName *string

	err := r.pool.QueryRow(ctx,
		`SELECT c.id, c.user_id, c.name, c.description, c.location, c.created_at,
		        i.id, i.name
		 FROM companies c
		 LEFT JOIN industries i ON i.id = c.industry_id
		 WHERE c.id = $1`,
		id,
	).Scan(&c.ID, &c.UserID, &c.Name, &c.Description, &c.Location, &c.CreatedAt,
		&indID, &indName)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if indID != nil && indName != nil {
		c.Industry = &model.Industry{ID: *indID, Name: *indName}
	}
	return &c, nil
}

func (r *CompaniesRepo) Upsert(ctx context.Context, userID uuid.UUID, name string, description, location *string, industryID *uuid.UUID) (*model.Company, error) {
	var c model.Company
	var storedIndID *uuid.UUID

	err := r.pool.QueryRow(ctx,
		`INSERT INTO companies (user_id, name, description, location, industry_id)
		 VALUES ($1, $2, $3, $4, $5)
		 ON CONFLICT (user_id) DO UPDATE SET
		     name = EXCLUDED.name,
		     description = EXCLUDED.description,
		     location = EXCLUDED.location,
		     industry_id = EXCLUDED.industry_id
		 RETURNING id, user_id, industry_id, name, description, location, created_at`,
		userID, name, description, location, industryID,
	).Scan(&c.ID, &c.UserID, &storedIndID, &c.Name, &c.Description, &c.Location, &c.CreatedAt)
	if err != nil {
		return nil, err
	}

	if storedIndID != nil {
		var indID uuid.UUID
		var indName string
		err = r.pool.QueryRow(ctx,
			`SELECT id, name FROM industries WHERE id = $1`, *storedIndID,
		).Scan(&indID, &indName)
		if err == nil {
			c.Industry = &model.Industry{ID: indID, Name: indName}
		}
	}

	return &c, nil
}
