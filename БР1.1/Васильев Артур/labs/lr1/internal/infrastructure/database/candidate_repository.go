package database

import (
	"context"
	"errors"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"jobsearch/internal/domain"
	"jobsearch/pkg/apperror"
	"jobsearch/pkg/slogutil"
)

const candidateRepoComponent = "candidate_repository"

type CandidateRepository struct {
	pool *pgxpool.Pool
}

func NewCandidateRepository(pool *pgxpool.Pool) *CandidateRepository {
	return &CandidateRepository{pool: pool}
}

func (r *CandidateRepository) Create(ctx context.Context, userID uuid.UUID, fullName string) (*domain.Candidate, error) {
	slogutil.LogDebug(ctx, slogutil.LayerRepository, candidateRepoComponent, "create candidate",
		slog.String("user_id", userID.String()),
		slog.String("full_name", fullName),
	)

	const q = `
		INSERT INTO candidates (user_id, full_name)
		VALUES ($1, $2)
		RETURNING id, user_id, full_name, phone, city, birth_date, created_at`
	var c domain.Candidate
	var phone, city pgtype.Text
	err := r.pool.QueryRow(ctx, q, userID, fullName).Scan(
		&c.ID, &c.UserID, &c.FullName, &phone, &city, &c.BirthDate, &c.CreatedAt,
	)
	if err != nil {
		slogutil.LogError(ctx, slogutil.LayerRepository, candidateRepoComponent, "insert candidate failed", err,
			slog.String("user_id", userID.String()),
		)
		return nil, apperror.Internal(err)
	}
	c.Phone = textFromNullable(phone)
	c.City = textFromNullable(city)

	slogutil.LogInfo(ctx, slogutil.LayerRepository, candidateRepoComponent, "candidate created",
		slog.String("candidate_id", c.ID.String()),
	)
	return &c, nil
}

func (r *CandidateRepository) GetByUserID(ctx context.Context, userID uuid.UUID) (*domain.Candidate, error) {
	const q = `SELECT id, user_id, full_name, phone, city, birth_date, created_at FROM candidates WHERE user_id = $1`
	var c domain.Candidate
	var phone, city pgtype.Text
	err := r.pool.QueryRow(ctx, q, userID).Scan(
		&c.ID, &c.UserID, &c.FullName, &phone, &city, &c.BirthDate, &c.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperror.NotFound("candidate profile not found")
		}
		slogutil.LogError(ctx, slogutil.LayerRepository, candidateRepoComponent, "select candidate failed", err)
		return nil, apperror.Internal(err)
	}
	c.Phone = textFromNullable(phone)
	c.City = textFromNullable(city)
	return &c, nil
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
	var c domain.Candidate
	var phoneCol, cityCol pgtype.Text
	err := r.pool.QueryRow(ctx, q, id, fullName, phone, city, birthDate).Scan(
		&c.ID, &c.UserID, &c.FullName, &phoneCol, &cityCol, &c.BirthDate, &c.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperror.NotFound("candidate profile not found")
		}
		slogutil.LogError(ctx, slogutil.LayerRepository, candidateRepoComponent, "update candidate failed", err)
		return nil, apperror.Internal(err)
	}
	c.Phone = textFromNullable(phoneCol)
	c.City = textFromNullable(cityCol)
	return &c, nil
}
