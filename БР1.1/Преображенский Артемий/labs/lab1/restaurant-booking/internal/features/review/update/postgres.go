package update

import (
	"context"
	"errors"

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

func (r *postgresRepository) Update(ctx context.Context, review domain.Review) (domain.Review, error) {
	var result domain.Review
	err := r.pool.Pgx().QueryRow(ctx, `
		UPDATE reviews
		SET rating = $4, text = $5, updated_at = now()
		WHERE id = $1 AND restaurant_id = $2 AND user_id = $3
		RETURNING id, user_id, restaurant_id, rating, text, created_at, updated_at
	`, review.ID, review.RestaurantID, review.UserID, int(review.Rating), review.Text).Scan(
		&result.ID,
		&result.UserID,
		&result.RestaurantID,
		&result.Rating,
		&result.Text,
		&result.CreatedAt,
		&result.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Review{}, domain.ErrNotFound
		}
		return domain.Review{}, err
	}
	return result, nil
}
