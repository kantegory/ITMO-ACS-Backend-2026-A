package availability

import (
	"context"
	"time"

	"github.com/google/uuid"

	"restaurant-booking/booking-service/internal/adapter/postgres"
)

type postgresRepository struct {
	pool *postgres.Pool
}

func NewPostgres(pool *postgres.Pool) *postgresRepository {
	return &postgresRepository{pool: pool}
}

func bookingDateUTC(start time.Time) time.Time {
	u := start.UTC()
	return time.Date(u.Year(), u.Month(), u.Day(), 0, 0, 0, 0, time.UTC)
}

func (r *postgresRepository) HasOverlap(ctx context.Context, tableID uuid.UUID, candStart time.Time, candEnd time.Time) (bool, error) {
	bd := bookingDateUTC(candStart)
	st := candStart.UTC()
	et := candEnd.UTC()
	var exists bool
	err := r.pool.Pgx().QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM bookings
			WHERE table_id = $1
			AND booking_date = $2::date
			AND status <> 'cancelled'
			AND start_time < $4::time AND end_time > $3::time
		)
	`, tableID, bd, st, et).Scan(&exists)
	if err != nil {
		return false, err
	}
	return exists, nil
}
