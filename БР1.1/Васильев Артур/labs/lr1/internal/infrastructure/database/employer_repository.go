package database

import (
	"context"
	"errors"
	"log/slog"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"jobsearch/internal/domain"
	"jobsearch/pkg/apperror"
	"jobsearch/pkg/slogutil"
)

const employerRepoComponent = "employer_repository"

type EmployerRepository struct {
	pool *pgxpool.Pool
}

func NewEmployerRepository(pool *pgxpool.Pool) *EmployerRepository {
	return &EmployerRepository{pool: pool}
}

func scanEmployer(row pgx.Row) (domain.Employer, error) {
	var e domain.Employer
	var desc, website, logo pgtype.Text
	err := row.Scan(
		&e.ID, &e.UserID, &e.CompanyName, &desc, &website, &logo, &e.CreatedAt,
	)
	if err != nil {
		return domain.Employer{}, err
	}
	e.CompanyDescription = textFromNullable(desc)
	e.Website = textFromNullable(website)
	e.LogoURL = textFromNullable(logo)
	return e, nil
}

func (r *EmployerRepository) Create(ctx context.Context, userID uuid.UUID, companyName string) (*domain.Employer, error) {
	const q = `
		INSERT INTO employers (user_id, company_name)
		VALUES ($1, $2)
		RETURNING id, user_id, company_name, company_description, website, logo_url, created_at`
	e, err := scanEmployer(r.pool.QueryRow(ctx, q, userID, companyName))
	if err != nil {
		slogutil.LogError(ctx, slogutil.LayerRepository, employerRepoComponent, "insert employer failed", err,
			slog.String("user_id", userID.String()),
		)
		return nil, apperror.Internal(err)
	}
	slogutil.LogInfo(ctx, slogutil.LayerRepository, employerRepoComponent, "employer created",
		slog.String("employer_id", e.ID.String()),
	)
	return &e, nil
}

func (r *EmployerRepository) GetByUserID(ctx context.Context, userID uuid.UUID) (*domain.Employer, error) {
	const q = `SELECT id, user_id, company_name, company_description, website, logo_url, created_at FROM employers WHERE user_id = $1`
	e, err := scanEmployer(r.pool.QueryRow(ctx, q, userID))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperror.NotFound("employer profile not found")
		}
		return nil, apperror.Internal(err)
	}
	return &e, nil
}

func (r *EmployerRepository) UpdateProfile(ctx context.Context, id uuid.UUID, companyName, desc, website, logo string) (*domain.Employer, error) {
	const q = `
		UPDATE employers SET
			company_name = COALESCE(NULLIF($2, ''), company_name),
			company_description = COALESCE(NULLIF($3, ''), company_description),
			website = $4,
			logo_url = $5
		WHERE id = $1
		RETURNING id, user_id, company_name, company_description, website, logo_url, created_at`
	e, err := scanEmployer(r.pool.QueryRow(ctx, q, id, companyName, desc, website, logo))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperror.NotFound("employer profile not found")
		}
		return nil, apperror.Internal(err)
	}
	return &e, nil
}
