package get

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"restaurant-booking/internal/adapter/postgres"
	"restaurant-booking/internal/domain"
)

type postgresRepository struct {
	pool *postgres.Pool
}

func NewPostgres(pool *postgres.Pool) *postgresRepository {
	return &postgresRepository{pool: pool}
}

func (r *postgresRepository) GetByRestaurantAndID(ctx context.Context, restaurantID uuid.UUID, reviewID uuid.UUID) (domain.Review, error) {
	var result domain.Review
	err := r.pool.Pgx().QueryRow(ctx, `
		SELECT
			id,
			user_id,
			restaurant_id,
			rating,
			text,
			created_at,
			updated_at
		FROM reviews
		WHERE restaurant_id = $1 AND id = $2
		LIMIT 1
	`, restaurantID, reviewID).Scan(&result.ID, &result.UserID, &result.RestaurantID, &result.Rating, &result.Text, &result.CreatedAt, &result.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Review{}, domain.ErrNotFound
		}
		return domain.Review{}, err
	}
	return result, nil
}
