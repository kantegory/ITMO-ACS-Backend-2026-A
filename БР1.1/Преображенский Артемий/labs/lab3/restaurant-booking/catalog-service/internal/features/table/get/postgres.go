package get

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

func (r *postgresRepository) GetByRestaurantAndID(ctx context.Context, restaurantID uuid.UUID, tableID uuid.UUID) (domain.Table, error) {
	var out domain.Table
	err := r.pool.Pgx().QueryRow(ctx, `
		SELECT id, restaurant_id, table_number, seats_count
		FROM restaurant_tables
		WHERE restaurant_id = $1 AND id = $2
		LIMIT 1
	`, restaurantID, tableID).Scan(&out.ID, &out.RestaurantID, &out.Number, &out.Seats)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Table{}, domain.ErrNotFound
		}
		return domain.Table{}, err
	}
	return out, nil
}
