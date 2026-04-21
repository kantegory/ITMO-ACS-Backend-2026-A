package delete

import (
	"context"
	"errors"
	"restaurant-booking/internal/adapter/postgres"
	"restaurant-booking/internal/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type postgresRepository struct {
	pool *postgres.Pool
}

func NewPostgres(pool *postgres.Pool) *postgresRepository {
	return &postgresRepository{pool: pool}
}

func (r *postgresRepository) Delete(ctx context.Context, id uuid.UUID) (domain.Restaurant, error) {
	const query = `
		DELETE FROM restaurants WHERE id = $1 RETURNING id
	`
	var restaurantID uuid.UUID
	err := r.pool.Pgx().QueryRow(ctx, query, id).Scan(&restaurantID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Restaurant{}, domain.ErrNotFound
		}
		return domain.Restaurant{}, err
	}
	return domain.Restaurant{ID: restaurantID}, nil
}
