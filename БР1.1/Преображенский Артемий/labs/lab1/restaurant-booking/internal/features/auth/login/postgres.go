package login

import (
	"context"
	"errors"

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

func (r *postgresRepository) FindForLogin(ctx context.Context, email domain.Email) (domain.User, error) {
	var u domain.User
	var phone *string
	err := r.pool.Pgx().QueryRow(ctx, `
		SELECT id, email, password_hash, full_name, phone, created_at, updated_at
		FROM users WHERE email = $1
	`, string(email)).Scan(
		&u.ID,
		&u.Email,
		&u.Password,
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
