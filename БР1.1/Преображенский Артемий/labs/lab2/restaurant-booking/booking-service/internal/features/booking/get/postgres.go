package get

import (
	"context"
	"errors"
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

func (r *postgresRepository) GetByIDAndUser(ctx context.Context, bookingID uuid.UUID, userID uuid.UUID) (domain.Booking, error) {
	var b domain.Booking
	var bd, stClock, etClock time.Time
	err := r.pool.Pgx().QueryRow(ctx, `
		SELECT
			id,
			user_id,
			restaurant_id,
			table_id,
			guests_count,
			booking_date,
			start_time,
			end_time,
			status::text,
			created_at,
			updated_at
		FROM bookings
		WHERE id = $1 AND user_id = $2
	`, bookingID, userID).Scan(
		&b.ID,
		&b.UserID,
		&b.RestaurantID,
		&b.TableID,
		&b.GuestsCount,
		&bd,
		&stClock,
		&etClock,
		&b.Status,
		&b.CreatedAt,
		&b.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Booking{}, domain.ErrNotFound
		}
		return domain.Booking{}, err
	}
	b.StartTime, b.EndTime = domain.JoinBookingDateTimes(bd, stClock, etClock)
	return b, nil
}
