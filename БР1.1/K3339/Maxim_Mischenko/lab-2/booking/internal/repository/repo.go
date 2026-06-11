package repository

import (
	"booking/internal/models"

	"github.com/jmoiron/sqlx"
)

type BookingRepository struct {
	db *sqlx.DB
}

func NewBookingRepository(db *sqlx.DB) *BookingRepository {
	return &BookingRepository{db: db}
}

func (r *BookingRepository) IsTableBusy(tableID int, date, start, end string) (bool, error) {
	var count int
	query := `
		SELECT COUNT(*) FROM bookings
		WHERE table_id = $1 AND booking_date = $2 AND status != 'cancelled'
		AND (
			(start_time <= $3 AND end_time > $3) OR
			(start_time < $4 AND end_time >= $4)
		)`
	err := r.db.Get(&count, query, tableID, date, start, end)
	return count > 0, err
}

func (r *BookingRepository) GetBusyTableIDs(resID int, date string) ([]int, error) {
	var ids []int
	query := "SELECT table_id FROM bookings WHERE restaurant_id = $1 AND booking_date = $2 AND status != 'cancelled'"
	err := r.db.Select(&ids, query, resID, date)
	if err != nil {
		return nil, err
	}
	if ids == nil {
		return []int{}, nil
	}
	return ids, nil
}

func (r *BookingRepository) CreateBooking(b *models.Booking) error {
	query := `INSERT INTO bookings (user_id, restaurant_id, table_id, booking_date, start_time, end_time, guests_count, status)
			  VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending') RETURNING id`
	return r.db.QueryRow(query, b.UserID, b.RestaurantID, b.TableID, b.BookingDate, b.StartTime, b.EndTime, b.GuestsCount).Scan(&b.ID)
}

func (r *BookingRepository) GetUserBookings(userID int) ([]models.Booking, error) {
	list := []models.Booking{}
	err := r.db.Select(&list, "SELECT * FROM bookings WHERE user_id = $1 ORDER BY booking_date DESC", userID)
	return list, err
}
