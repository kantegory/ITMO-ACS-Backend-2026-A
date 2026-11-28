package internalgettable

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

func (r *postgresRepository) GetByRestaurantAndID(ctx context.Context, restaurantID uuid.UUID, tableID uuid.UUID) (Table, error) {
	var out Table
	err := r.pool.Pgx().QueryRow(ctx, `
		SELECT id, restaurant_id, table_number, seats_count
		FROM restaurant_tables
		WHERE restaurant_id = $1 AND id = $2
	`, restaurantID, tableID).Scan(&out.ID, &out.RestaurantID, &out.TableNumber, &out.SeatsCount)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Table{}, domain.ErrNotFound
		}
		return Table{}, err
	}
	return out, nil
}
