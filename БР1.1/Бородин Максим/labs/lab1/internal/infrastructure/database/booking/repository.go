package bookingrepo

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/borodin-maksim/restaurant-booking/internal/domain"
)

type Filter struct {
	UserID string
	Status string
	Limit  int
	Offset int
}

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Create(ctx context.Context, b *domain.Booking) error {
	query := `INSERT INTO bookings (id, user_id, table_id, booked_date, time_from, time_to, guests_count, status, created_at)
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`
	_, err := r.db.ExecContext(ctx, query,
		b.ID, b.UserID, b.TableID, b.BookedDate, b.TimeFrom, b.TimeTo,
		b.GuestsCount, b.Status, b.CreatedAt,
	)
	return err
}

func (r *Repository) GetByID(ctx context.Context, id string) (*domain.Booking, error) {
	query := `SELECT id, user_id, table_id,
	                 booked_date::text,
	                 to_char(time_from, 'HH24:MI'),
	                 to_char(time_to,   'HH24:MI'),
	                 guests_count, status, created_at
	          FROM bookings WHERE id = $1`
	b := &domain.Booking{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&b.ID, &b.UserID, &b.TableID,
		&b.BookedDate, &b.TimeFrom, &b.TimeTo,
		&b.GuestsCount, &b.Status, &b.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return b, nil
}

func (r *Repository) IsTableBooked(ctx context.Context, tableID, date, timeFrom, timeTo string) (bool, error) {
	query := `SELECT EXISTS(
		SELECT 1 FROM bookings
		WHERE table_id = $1
		  AND booked_date = $2
		  AND status != 'cancelled'
		  AND time_from < $4
		  AND time_to > $3
	)`
	var exists bool
	err := r.db.QueryRowContext(ctx, query, tableID, date, timeFrom, timeTo).Scan(&exists)
	return exists, err
}

func (r *Repository) UpdateStatus(ctx context.Context, id, status string) error {
	query := `UPDATE bookings SET status = $1 WHERE id = $2`
	res, err := r.db.ExecContext(ctx, query, status, id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *Repository) List(ctx context.Context, f Filter) ([]*domain.Booking, int, error) {
	args := []any{}
	i := 1
	where := "WHERE 1=1"

	if f.UserID != "" {
		where += fmt.Sprintf(" AND user_id = $%d", i)
		args = append(args, f.UserID)
		i++
	}
	if f.Status != "" {
		where += fmt.Sprintf(" AND status = $%d", i)
		args = append(args, f.Status)
		i++
	}

	var total int
	if err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM bookings `+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	limit := f.Limit
	if limit <= 0 {
		limit = 20
	}
	args = append(args, limit, f.Offset)
	query := fmt.Sprintf(`
		SELECT id, user_id, table_id,
		       booked_date::text,
		       to_char(time_from, 'HH24:MI'),
		       to_char(time_to,   'HH24:MI'),
		       guests_count, status, created_at
		FROM bookings %s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d`, where, i, i+1)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var list []*domain.Booking
	for rows.Next() {
		b := &domain.Booking{}
		if err := rows.Scan(
			&b.ID, &b.UserID, &b.TableID,
			&b.BookedDate, &b.TimeFrom, &b.TimeTo,
			&b.GuestsCount, &b.Status, &b.CreatedAt,
		); err != nil {
			return nil, 0, err
		}
		list = append(list, b)
	}
	return list, total, rows.Err()
}
