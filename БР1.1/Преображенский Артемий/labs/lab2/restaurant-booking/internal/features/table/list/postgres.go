package list

import (
	"context"

	"github.com/google/uuid"

	"restaurant-booking/internal/adapter/postgres"
	"restaurant-booking/internal/domain"
)

type postgresRepository struct {
	pool *postgres.Pool
}

func NewPostgres(pool *postgres.Pool) *postgresRepository {
	return &postgresRepository{pool: pool}
}

func (r *postgresRepository) ListByRestaurant(ctx context.Context, restaurantID uuid.UUID) ([]domain.Table, error) {
	rows, err := r.pool.Pgx().Query(ctx, `
		SELECT id, restaurant_id, table_number, seats_count
		FROM restaurant_tables
		WHERE restaurant_id = $1
		ORDER BY table_number
	`, restaurantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]domain.Table, 0)
	for rows.Next() {
		var t domain.Table
		if err := rows.Scan(&t.ID, &t.RestaurantID, &t.Number, &t.Seats); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}
