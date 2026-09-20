package create

import (
	"context"
	"crypto/sha256"
	"encoding/binary"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

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
	b.StartTime = b.StartTime.UTC().Truncate(time.Microsecond)
	b.EndTime = b.EndTime.UTC().Truncate(time.Microsecond)
	if err := b.Validate(); err != nil {
		return domain.Booking{}, err
	}
	tx, err := r.pool.Pgx().BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.ReadCommitted})
	if err != nil {
		return domain.Booking{}, err
	}
	defer func() {
		cleanup, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()
		_ = tx.Rollback(cleanup)
	}()
	key := sha256.Sum256([]byte("restaurant-booking:booking:table:" + b.TableID.String()))
	if _, err := tx.Exec(ctx, "SELECT pg_advisory_xact_lock($1)", int64(binary.BigEndian.Uint64(key[:8]))); err != nil {
		return domain.Booking{}, err
	}
	var overlap bool
	if err := tx.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM bookings
			WHERE table_id = $1 AND booking_date = $2::date AND status <> 'cancelled'
			AND start_time < $4::time AND end_time > $3::time
		)
	`, b.TableID, bookingDateUTC(b.StartTime), b.StartTime, b.EndTime).Scan(&overlap); err != nil {
		return domain.Booking{}, err
	}
	if overlap {
		return domain.Booking{}, domain.ErrUnavailable
	}
	const q = `
		INSERT INTO bookings (user_id, restaurant_id, table_id, booking_date, start_time, end_time, guests_count, status)
		VALUES ($1, $2, $3, $4::date, $5::time, $6::time, $7, 'confirmed')
		RETURNING id, status::text, created_at, updated_at
	`
	var out domain.Booking
	err = tx.QueryRow(ctx, q,
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
	if err := tx.Commit(ctx); err != nil {
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
