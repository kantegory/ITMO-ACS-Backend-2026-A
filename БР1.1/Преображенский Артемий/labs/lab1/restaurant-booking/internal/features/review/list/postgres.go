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

func (r *postgresRepository) ListByRestaurant(ctx context.Context, restaurantID uuid.UUID) ([]domain.Review, error) {
	rows, err := r.pool.Pgx().Query(ctx, `
		SELECT
			id,
			user_id,
			restaurant_id,
			rating,
			text,
			created_at,
			updated_at
		FROM reviews
		WHERE restaurant_id = $1
		ORDER BY created_at DESC
	`, restaurantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]domain.Review, 0)
	for rows.Next() {
		var review domain.Review
		if err := rows.Scan(&review.ID, &review.UserID, &review.RestaurantID, &review.Rating, &review.Text, &review.CreatedAt, &review.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, review)
	}
	return out, rows.Err()
}
