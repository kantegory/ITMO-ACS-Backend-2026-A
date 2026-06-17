package create

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

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
		b.BookingDate,
		b.StartTime,
		b.EndTime,
		b.GuestsCount,
	).Scan(&out.ID, &out.Status, &out.CreatedAt, &out.UpdatedAt)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23503" {
			return domain.Booking{}, domain.ErrNotFound
		}
		return domain.Booking{}, err
	}
	out.UserID = b.UserID
	out.RestaurantID = b.RestaurantID
	out.TableID = b.TableID
	out.GuestsCount = b.GuestsCount
	out.BookingDate = b.BookingDate
	out.StartTime = b.StartTime
	out.EndTime = b.EndTime
	return out, nil
}
