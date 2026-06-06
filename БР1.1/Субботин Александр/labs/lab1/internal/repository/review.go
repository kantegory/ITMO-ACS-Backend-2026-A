package repository

import (
	"database/sql"

	"github.com/ZZISST/rental-api/internal/model"
)

type ReviewRepository struct {
	db *sql.DB
}

func NewReviewRepository(db *sql.DB) *ReviewRepository {
	return &ReviewRepository{db: db}
}

func (r *ReviewRepository) Create(authorID string, req model.CreateReviewRequest, propertyID string) (*model.Review, error) {
	rev := &model.Review{}
	err := r.db.QueryRow(
		`INSERT INTO reviews (booking_id, property_id, author_id, rating, text)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, booking_id, property_id, author_id, rating, text, created_at`,
		req.BookingID, propertyID, authorID, req.Rating, req.Text,
	).Scan(&rev.ID, &rev.BookingID, &rev.PropertyID, &rev.AuthorID, &rev.Rating, &rev.Text, &rev.CreatedAt)
	if err != nil {
		return nil, err
	}
	return rev, nil
}

func (r *ReviewRepository) ExistsByBooking(bookingID string) (bool, error) {
	var count int
	err := r.db.QueryRow("SELECT COUNT(*) FROM reviews WHERE booking_id = $1", bookingID).Scan(&count)
	return count > 0, err
}
