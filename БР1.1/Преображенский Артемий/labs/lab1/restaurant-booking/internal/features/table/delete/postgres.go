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

func (r *postgresRepository) Delete(ctx context.Context, restaurantID uuid.UUID, tableID uuid.UUID) error {
	ct, err := r.pool.Pgx().Exec(ctx, `
		DELETE FROM restaurant_tables
		WHERE restaurant_id = $1 AND id = $2
	`, restaurantID, tableID)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}
