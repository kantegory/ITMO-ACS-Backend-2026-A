package repository

import (
	"review/internal/models"
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/jmoiron/sqlx"
)

type ReviewRepository struct {
	db *sqlx.DB
	catalogURL string
}

func NewReviewRepository(db *sqlx.DB, catalogURL string) *ReviewRepository {
	return &ReviewRepository{db: db, catalogURL: catalogURL}
}

func (r *ReviewRepository) CreateReview(rev *models.Review) error {
	tx, err := r.db.Beginx()
	if err != nil {
		return err
	}

	query := `INSERT INTO reviews (user_id, restaurant_id, booking_id, rating, comment)
			  VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at`
	err = tx.QueryRow(query, rev.UserID, rev.RestaurantID, rev.BookingID, rev.Rating, rev.Comment).Scan(&rev.ID, &rev.CreatedAt)
	if err != nil {
		tx.Rollback()
		return err
	}

	var stats struct {
		Avg float64 `db:"avg_rating"`
		Count int `db:"cnt"`
	}
	statsQuery := `SELECT COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as cnt
				   FROM reviews WHERE restaurant_id = $1`
	err = tx.Get(&stats, statsQuery, rev.RestaurantID)
	if err != nil {
		tx.Rollback()
		return err
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	go r.notifyCatalog(rev.RestaurantID, stats.Avg, stats.Count)

	return nil
}

func (r *ReviewRepository) notifyCatalog(resID int, avg float64, count int) {
	updateReq := models.UpdateRatingReq{
		AvgRating: avg,
		ReviewsCount: count,
	}
	body, _ := json.Marshal(updateReq)
	url := fmt.Sprintf("%s/internal/restaurants/%d/rating", r.catalogURL, resID)

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(body))
	if err != nil || resp.StatusCode != http.StatusOK {
		fmt.Printf("Failed ot notify Catalog Service for restaurant %d\n", resID)
	}
}

func (r *ReviewRepository) GetByRestaurant(resID int) ([]models.Review, error) {
	var list []models.Review
	err := r.db.Select(&list, "SELECT * FROM reviews WHERE restaurant_id = $1", resID)
	return list, err
}
