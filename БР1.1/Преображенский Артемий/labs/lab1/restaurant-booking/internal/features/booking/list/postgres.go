package list

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

func (r *postgresRepository) ListByUser(ctx context.Context, userID uuid.UUID) ([]domain.Booking, error) {
	rows, err := r.pool.Pgx().Query(ctx, `
		SELECT
			id,
			user_id,
			restaurant_id,
			table_id,
			guests_count,
			booking_date::text,
			start_time::text,
			end_time::text,
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
		if err := rows.Scan(
			&b.ID,
			&b.UserID,
			&b.RestaurantID,
			&b.TableID,
			&b.GuestsCount,
			&b.BookingDate,
			&b.StartTime,
			&b.EndTime,
			&b.Status,
			&b.CreatedAt,
			&b.UpdatedAt,
		); err != nil {
			return nil, err
		}
		out = append(out, b)
	}
	return out, rows.Err()
}
