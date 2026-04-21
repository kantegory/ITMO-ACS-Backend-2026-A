package list

import (
	"context"

	"github.com/google/uuid"

	"restaurant-booking/internal/adapter/postgres"
)

type postgresRepository struct {
	pool *postgres.Pool
}

func NewPostgres(pool *postgres.Pool) *postgresRepository {
	return &postgresRepository{pool: pool}
}

func (r *postgresRepository) ListByRestaurant(ctx context.Context, restaurantID uuid.UUID) ([]Item, error) {
	rows, err := r.pool.Pgx().Query(ctx, `
		SELECT
			rev.id,
			rev.rating,
			rev.text,
			rev.created_at,
			u.full_name
		FROM reviews rev
		JOIN users u ON u.id = rev.user_id
		WHERE rev.restaurant_id = $1
		ORDER BY rev.created_at DESC
	`, restaurantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]Item, 0)
	for rows.Next() {
		var it Item
		if err := rows.Scan(&it.ID, &it.Rating, &it.Text, &it.CreatedAt, &it.AuthorName); err != nil {
			return nil, err
		}
		out = append(out, it)
	}
	return out, rows.Err()
}
