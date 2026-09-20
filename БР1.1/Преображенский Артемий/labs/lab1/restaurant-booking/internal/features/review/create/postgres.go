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

func (r *postgresRepository) Create(ctx context.Context, review domain.Review) (domain.Review, error) {
	var result domain.Review
	err := r.pool.Pgx().QueryRow(ctx, `
		INSERT INTO reviews (user_id, restaurant_id, rating, text)
		VALUES ($1, $2, $3, $4)
		RETURNING id, user_id, restaurant_id, rating, text, created_at, updated_at
	`, review.UserID, review.RestaurantID, int(review.Rating), review.Text).Scan(
		&result.ID,
		&result.UserID,
		&result.RestaurantID,
		&result.Rating,
		&result.Text,
		&result.CreatedAt,
		&result.UpdatedAt,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return domain.Review{}, domain.ErrConflict
		}
		if errors.As(err, &pgErr) && pgErr.Code == "23503" {
			return domain.Review{}, domain.ErrNotFound
		}
		return domain.Review{}, err
	}
	return result, nil
}
