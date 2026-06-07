package database

import (
	"context"
	"errors"
	"log/slog"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"jobsearch/internal/domain"
	"jobsearch/pkg/apperror"
	"jobsearch/pkg/slogutil"
)

const userRepoComponent = "user_repository"

type UserRepository struct {
	pool *pgxpool.Pool
}

func NewUserRepository(pool *pgxpool.Pool) *UserRepository {
	return &UserRepository{pool: pool}
}

func (r *UserRepository) Create(ctx context.Context, email, passwordHash string, role domain.Role) (*domain.User, error) {
	slogutil.LogDebug(ctx, slogutil.LayerRepository, userRepoComponent, "create user",
		slog.String("email", email),
		slog.String("role", string(role)),
	)

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
			slogutil.LogInfo(ctx, slogutil.LayerRepository, userRepoComponent, "email already exists",
				slog.String("email", email),
			)
			return nil, apperror.Conflict("email already registered")
		}
		slogutil.LogError(ctx, slogutil.LayerRepository, userRepoComponent, "insert user failed", err,
			slog.String("email", email),
		)
		return nil, apperror.Internal(err)
	}
	u.Role = domain.Role(roleStr)

	slogutil.LogInfo(ctx, slogutil.LayerRepository, userRepoComponent, "user created",
		slog.String("user_id", u.ID.String()),
	)
	return &u, nil
}

func (r *UserRepository) DeleteByID(ctx context.Context, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM users WHERE id = $1`, id)
	if err != nil {
		slogutil.LogError(ctx, slogutil.LayerRepository, userRepoComponent, "delete user failed", err,
			slog.String("user_id", id.String()),
		)
		return apperror.Internal(err)
	}
	if tag.RowsAffected() == 0 {
		return apperror.NotFound("user not found")
	}
	slogutil.LogInfo(ctx, slogutil.LayerRepository, userRepoComponent, "user deleted (rollback)",
		slog.String("user_id", id.String()),
	)
	return nil
}

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	slogutil.LogDebug(ctx, slogutil.LayerRepository, userRepoComponent, "get user by email",
		slog.String("email", email),
	)

	const q = `SELECT id, email, password_hash, role::text, created_at, updated_at FROM users WHERE email = $1`
	var u domain.User
	var roleStr string
	err := r.pool.QueryRow(ctx, q, email).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &roleStr, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			slogutil.LogInfo(ctx, slogutil.LayerRepository, userRepoComponent, "user not found by email",
				slog.String("email", email),
			)
			return nil, apperror.NotFound("user not found")
		}
		slogutil.LogError(ctx, slogutil.LayerRepository, userRepoComponent, "select user by email failed", err)
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
		slogutil.LogError(ctx, slogutil.LayerRepository, userRepoComponent, "select user by id failed", err,
			slog.String("user_id", id.String()),
		)
		return nil, apperror.Internal(err)
	}
	u.Role = domain.Role(roleStr)
	return &u, nil
}
