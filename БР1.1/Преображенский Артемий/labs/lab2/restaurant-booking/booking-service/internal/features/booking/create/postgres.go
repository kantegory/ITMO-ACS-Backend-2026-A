package create

import (
	"context"
	"time"

	"github.com/google/uuid"

	"restaurant-booking/booking-service/internal/adapter/postgres"
	"restaurant-booking/booking-service/internal/domain"
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

func (r *postgresRepository) Create(ctx context.Context, b domain.Booking) (domain.Booking, error) {
	const q = `
		INSERT INTO bookings (user_id, restaurant_id, table_id, booking_date, start_time, end_time, guests_count, status)
		VALUES ($1, $2, $3, $4::date, $5::time, $6::time, $7, 'confirmed')
		RETURNING id, status::text, created_at, updated_at
	`
	var out domain.Booking
	err := r.pool.Pgx().QueryRow(ctx, q,
		b.UserID,
		b.RestaurantID,
		b.TableID,
		bookingDateUTC(b.StartTime),
		b.StartTime,
		b.EndTime,
		b.GuestsCount,
	).Scan(&out.ID, &out.Status, &out.CreatedAt, &out.UpdatedAt)
	if err != nil {
		return domain.Booking{}, err
	}
	out.UserID = b.UserID
	out.RestaurantID = b.RestaurantID
	out.TableID = b.TableID
	out.GuestsCount = b.GuestsCount
	out.StartTime = b.StartTime
	out.EndTime = b.EndTime
	return out, nil
}
