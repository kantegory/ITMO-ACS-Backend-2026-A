package delete

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

func (r *postgresRepository) Delete(ctx context.Context, userID uuid.UUID, restaurantID uuid.UUID, reviewID uuid.UUID) error {
	ct, err := r.pool.Pgx().Exec(ctx, `
		DELETE FROM reviews
		WHERE id = $1 AND restaurant_id = $2 AND user_id = $3
	`, reviewID, restaurantID, userID)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}
