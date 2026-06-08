package availability

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

func (r *postgresRepository) TableForRestaurant(ctx context.Context, tableID, restaurantID uuid.UUID) (domain.Table, error) {
	var t domain.Table
	err := r.pool.Pgx().QueryRow(ctx, `
		SELECT id, restaurant_id, table_number, seats_count
		FROM restaurant_tables
		WHERE id = $1 AND restaurant_id = $2
	`, tableID, restaurantID).Scan(&t.ID, &t.RestaurantID, &t.Number, &t.Seats)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Table{}, domain.ErrNotFound
		}
		return domain.Table{}, err
	}
	return t, nil
}

func (r *postgresRepository) HasOverlap(ctx context.Context, tableID uuid.UUID, bookingDate string, startTime string, endTime string) (bool, error) {
	var exists bool
	err := r.pool.Pgx().QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM bookings
			WHERE table_id = $1
			AND booking_date = $2::date
			AND status <> 'cancelled'
			AND start_time < $4::time AND end_time > $3::time
		)
	`, tableID, bookingDate, startTime, endTime).Scan(&exists)
	if err != nil {
		return false, err
	}
	return exists, nil
}
