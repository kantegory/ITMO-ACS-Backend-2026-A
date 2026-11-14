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

func (r *postgresRepository) GetByRestaurantAndID(ctx context.Context, restaurantID uuid.UUID, reviewID uuid.UUID) (Item, error) {
	var out Item
	err := r.pool.Pgx().QueryRow(ctx, `
		SELECT id, rating, text, created_at, updated_at, author_name
		FROM reviews
		WHERE restaurant_id = $1 AND id = $2
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
