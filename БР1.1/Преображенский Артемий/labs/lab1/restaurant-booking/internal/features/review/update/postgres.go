package update

import (
	"context"
	"errors"
	"strings"

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

func (r *postgresRepository) Update(ctx context.Context, userID uuid.UUID, restaurantID uuid.UUID, reviewID uuid.UUID, rating int, text string) (domain.Review, error) {
	t := strings.TrimSpace(text)
	if t == "" || rating < 1 || rating > 5 {
		return domain.Review{}, domain.ErrInvalidInput
	}
	var out domain.Review
	err := r.pool.Pgx().QueryRow(ctx, `
		UPDATE reviews
		SET rating = $4, text = $5, updated_at = now()
		WHERE id = $1 AND restaurant_id = $2 AND user_id = $3
		RETURNING id, user_id, restaurant_id, rating, text, created_at, updated_at
	`, reviewID, restaurantID, userID, rating, t).Scan(
		&out.ID,
		&out.UserID,
		&out.RestaurantID,
		&out.Rating,
		&out.Text,
		&out.CreatedAt,
		&out.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Review{}, domain.ErrNotFound
		}
		return domain.Review{}, err
	}
	return out, nil
}
