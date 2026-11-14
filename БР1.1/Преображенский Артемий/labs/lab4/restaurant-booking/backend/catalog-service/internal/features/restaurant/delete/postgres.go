package delete

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"restaurant-booking/catalog-service/internal/adapter/postgres"
	"restaurant-booking/catalog-service/internal/domain"
)

type postgresRepository struct {
	pool *postgres.Pool
}

func NewPostgres(pool *postgres.Pool) *postgresRepository {
	return &postgresRepository{pool: pool}
}

func (r *postgresRepository) Delete(ctx context.Context, id uuid.UUID) (domain.Restaurant, error) {
	const query = `DELETE FROM restaurants WHERE id = $1 RETURNING id`
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
