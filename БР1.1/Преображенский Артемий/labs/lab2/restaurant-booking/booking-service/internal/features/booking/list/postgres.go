package list

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

func (r *postgresRepository) ListByUser(ctx context.Context, userID uuid.UUID) ([]domain.Booking, error) {
	rows, err := r.pool.Pgx().Query(ctx, `
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
		WHERE user_id = $1
		ORDER BY booking_date DESC, start_time DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]domain.Booking, 0)
	for rows.Next() {
		var b domain.Booking
		var bd, stClock, etClock time.Time
		if err := rows.Scan(
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
		); err != nil {
			return nil, err
		}
		b.StartTime, b.EndTime = domain.JoinBookingDateTimes(bd, stClock, etClock)
		out = append(out, b)
	}
	return out, rows.Err()
}
