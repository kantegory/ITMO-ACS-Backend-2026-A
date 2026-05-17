package repository

import (
	"review/internal/models"
	"encoding/json"
	"fmt"

	"github.com/jmoiron/sqlx"
	"github.com/streadway/amqp"
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

	r.notifyCatalogAsync(rev.RestaurantID, stats.Avg, stats.Count)

	return nil
}

func (r *ReviewRepository) notifyCatalogAsync(resID int, avg float64, count int) {
	conn, err := amqp.Dial("amqp://guest:guest@rabbitmq:5672/")
	if err != nil {
		fmt.Printf("Failed to connect to RabbitMQ: %v\n", err)
		return
	}
	defer conn.Close()

	ch, _ := conn.Channel()
	defer ch.Close()

	q, _ := ch.QueueDeclare("rating_updates", true, false, false, false, nil)

	msgData := map[string]interface{}{
		"restaurant_id": resID,
		"avg_rating": avg,
		"reviews_count": count,
	}
	body, _ := json.Marshal(msgData)

	err = ch.Publish("", q.Name, false, false, amqp.Publishing{
		ContentType: "application/json",
		Body: body,
	})
	if err != nil {
		fmt.Printf("Failed to publish message: %v\n", err)
	}
}

func (r *ReviewRepository) GetByRestaurant(resID int) ([]models.Review, error) {
	var list []models.Review
	err := r.db.Select(&list, "SELECT * FROM reviews WHERE restaurant_id = $1", resID)
	return list, err
}
