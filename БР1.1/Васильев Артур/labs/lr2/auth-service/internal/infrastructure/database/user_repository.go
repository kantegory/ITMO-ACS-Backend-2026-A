package database

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"auth-service/internal/domain"
	"auth-service/pkg/apperror"
	"auth-service/pkg/slogutil"
)

const userRepoComponent = "user_repository"

type UserRepository struct {
	pool *pgxpool.Pool
}

func NewUserRepository(pool *pgxpool.Pool) *UserRepository {
	return &UserRepository{pool: pool}
}

func (r *UserRepository) Create(ctx context.Context, email, passwordHash string, role domain.Role) (*domain.User, error) {
	const q = `
		INSERT INTO users (email, password_hash, role)
		VALUES ($1, $2, $3)
		RETURNING id, email, password_hash, role::text, created_at, updated_at`
	var u domain.User
	var roleStr string
	err := r.pool.QueryRow(ctx, q, email, passwordHash, role).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &roleStr, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		if isUniqueViolation(err) {
			return nil, apperror.Conflict("email already registered")
		}
		slogutil.LogError(ctx, slogutil.LayerRepository, userRepoComponent, "insert user failed", err)
		return nil, apperror.Internal(err)
	}
	u.Role = domain.Role(roleStr)
	return &u, nil
}

func (r *UserRepository) DeleteByID(ctx context.Context, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM users WHERE id = $1`, id)
	if err != nil {
		return apperror.Internal(err)
	}
	if tag.RowsAffected() == 0 {
		return apperror.NotFound("user not found")
	}
	return nil
}

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	const q = `SELECT id, email, password_hash, role::text, created_at, updated_at FROM users WHERE email = $1`
	var u domain.User
	var roleStr string
	err := r.pool.QueryRow(ctx, q, email).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &roleStr, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperror.NotFound("user not found")
		}
		return nil, apperror.Internal(err)
	}
	u.Role = domain.Role(roleStr)
	return &u, nil
}

func (r *UserRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	const q = `SELECT id, email, password_hash, role::text, created_at, updated_at FROM users WHERE id = $1`
	var u domain.User
	var roleStr string
	err := r.pool.QueryRow(ctx, q, id).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &roleStr, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperror.NotFound("user not found")
		}
		return nil, apperror.Internal(err)
	}
	u.Role = domain.Role(roleStr)
	return &u, nil
}
