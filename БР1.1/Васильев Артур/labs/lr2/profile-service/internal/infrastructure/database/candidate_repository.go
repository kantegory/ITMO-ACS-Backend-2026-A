package database

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"profile-service/internal/domain"
	"profile-service/pkg/apperror"
)

type CandidateRepository struct {
	pool *pgxpool.Pool
}

func NewCandidateRepository(pool *pgxpool.Pool) *CandidateRepository {
	return &CandidateRepository{pool: pool}
}

func (r *CandidateRepository) Create(ctx context.Context, userID uuid.UUID, fullName string) (*domain.Candidate, error) {
	const q = `
		INSERT INTO candidates (user_id, full_name)
		VALUES ($1, $2)
		ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name
		RETURNING id, user_id, full_name, phone, city, birth_date, created_at`
	return r.scanCandidate(r.pool.QueryRow(ctx, q, userID, fullName))
}

func (r *CandidateRepository) GetByUserID(ctx context.Context, userID uuid.UUID) (*domain.Candidate, error) {
	const q = `SELECT id, user_id, full_name, phone, city, birth_date, created_at FROM candidates WHERE user_id = $1`
	c, err := r.scanCandidate(r.pool.QueryRow(ctx, q, userID))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperror.NotFound("candidate profile not found")
		}
		return nil, apperror.Internal(err)
	}
	return c, nil
}

func (r *CandidateRepository) ExistsByUserID(ctx context.Context, userID uuid.UUID) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM candidates WHERE user_id = $1)`, userID).Scan(&exists)
	return exists, err
}

func (r *CandidateRepository) UpdateProfile(ctx context.Context, id uuid.UUID, fullName, phone, city string, birthDate *time.Time) (*domain.Candidate, error) {
	const q = `
		UPDATE candidates SET
			full_name = COALESCE(NULLIF($2, ''), full_name),
			phone = $3,
			city = $4,
			birth_date = COALESCE($5, birth_date)
		WHERE id = $1
		RETURNING id, user_id, full_name, phone, city, birth_date, created_at`
	c, err := r.scanCandidate(r.pool.QueryRow(ctx, q, id, fullName, phone, city, birthDate))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperror.NotFound("candidate profile not found")
		}
		return nil, apperror.Internal(err)
	}
	return c, nil
}

func (r *CandidateRepository) scanCandidate(row pgx.Row) (*domain.Candidate, error) {
	var c domain.Candidate
	var phone, city pgtype.Text
	err := row.Scan(&c.ID, &c.UserID, &c.FullName, &phone, &city, &c.BirthDate, &c.CreatedAt)
	if err != nil {
		return nil, err
	}
	c.Phone = textFromNullable(phone)
	c.City = textFromNullable(city)
	return &c, nil
}
