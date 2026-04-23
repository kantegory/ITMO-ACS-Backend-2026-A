package register

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	"restaurant-booking/internal/adapter/postgres"
	"restaurant-booking/internal/domain"
)

type postgresRepository struct {
	pool *postgres.Pool
}

func NewPostgres(pool *postgres.Pool) *postgresRepository {
	return &postgresRepository{pool: pool}
}

func (r *postgresRepository) Create(ctx context.Context, email domain.Email, passwordHash string, fullName string, phone domain.Phone) (uuid.UUID, error) {
	var id uuid.UUID
	var phoneArg interface{}
	if phone != "" {
		phoneArg = string(phone)
	}
	err := r.pool.Pgx().QueryRow(ctx, `
		INSERT INTO users (email, password_hash, full_name, phone)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`, string(email), passwordHash, fullName, phoneArg).Scan(&id)
	if err != nil {
		return uuid.Nil, mapErr(err)
	}
	return id, nil
}

func (r *postgresRepository) GetByID(ctx context.Context, id uuid.UUID) (domain.User, error) {
	var u domain.User
	var phone *string
	err := r.pool.Pgx().QueryRow(ctx, `
		SELECT id, email, full_name, phone, created_at, updated_at
		FROM users WHERE id = $1
	`, id).Scan(
		&u.ID,
		&u.Email,
		&u.Name,
		&phone,
		&u.CreatedAt,
		&u.UpdatedAt,
	)
	if err != nil {
		return domain.User{}, mapErr(err)
	}
	if phone != nil {
		u.Phone = domain.Phone(*phone)
	}
	return u, nil
}

func mapErr(err error) error {
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.ErrNotFound
	}
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		return domain.ErrConflict
	}
	return err
}
