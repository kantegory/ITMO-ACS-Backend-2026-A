package userget

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"restaurant-booking/auth-service/internal/adapter/postgres"
	"restaurant-booking/auth-service/internal/domain"
)

type postgresRepository struct {
	pool *postgres.Pool
}

func NewPostgres(pool *postgres.Pool) *postgresRepository {
	return &postgresRepository{pool: pool}
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
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.User{}, domain.ErrNotFound
		}
		return domain.User{}, err
	}
	if phone != nil {
		u.Phone = domain.Phone(*phone)
	}
	return u, nil
}
