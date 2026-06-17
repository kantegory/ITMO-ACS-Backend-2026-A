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

func (r *postgresRepository) GetByRestaurantAndID(ctx context.Context, restaurantID uuid.UUID, reviewID uuid.UUID) (Item, error) {
	var out Item
	err := r.pool.Pgx().QueryRow(ctx, `
		SELECT
			rev.id,
			rev.rating,
			rev.text,
			rev.created_at,
			rev.updated_at,
			u.full_name
		FROM reviews rev
		JOIN users u ON u.id = rev.user_id
		WHERE rev.restaurant_id = $1 AND rev.id = $2
		LIMIT 1
	`, restaurantID, reviewID).Scan(&out.ID, &out.Rating, &out.Text, &out.CreatedAt, &out.UpdatedAt, &out.AuthorName)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Item{}, domain.ErrNotFound
		}
		return Item{}, err
	}
	return out, nil
}
