package cancel

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

func (r *postgresRepository) Cancel(ctx context.Context, userID uuid.UUID, bookingID uuid.UUID) error {
	ct, err := r.pool.Pgx().Exec(ctx, `
		UPDATE bookings
		SET status = 'cancelled', updated_at = now()
		WHERE id = $1 AND user_id = $2 AND status <> 'cancelled'
	`, bookingID, userID)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}
