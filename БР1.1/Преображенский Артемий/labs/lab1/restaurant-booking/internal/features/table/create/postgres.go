package create

import (
	"context"
	"errors"

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

func (r *postgresRepository) Create(ctx context.Context, table domain.Table) (domain.Table, error) {
	var result domain.Table
	err := r.pool.Pgx().QueryRow(ctx, `
		INSERT INTO restaurant_tables (restaurant_id, table_number, seats_count)
		VALUES ($1, $2, $3)
		RETURNING id, restaurant_id, table_number, seats_count
	`, table.RestaurantID, table.Number, table.Seats).Scan(&result.ID, &result.RestaurantID, &result.Number, &result.Seats)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return domain.Table{}, domain.ErrConflict
		}
		if errors.As(err, &pgErr) && pgErr.Code == "23503" {
			return domain.Table{}, domain.ErrNotFound
		}
		return domain.Table{}, err
	}
	return result, nil
}
