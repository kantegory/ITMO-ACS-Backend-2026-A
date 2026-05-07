package reviewrepo

import (
	"context"
	"database/sql"

	"github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/domain"
)

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Create(ctx context.Context, rv *domain.Review) error {
	query := `INSERT INTO reviews (id, user_id, restaurant_id, rating, comment, created_at)
	          VALUES ($1, $2, $3, $4, $5, $6)`
	_, err := r.db.ExecContext(ctx, query,
		rv.ID, rv.UserID, rv.RestaurantID, rv.Rating, rv.Comment, rv.CreatedAt)
	return err
}

func (r *Repository) ExistsByUserAndRestaurant(ctx context.Context, userID, restaurantID string) (bool, error) {
	var exists bool
	err := r.db.QueryRowContext(ctx,
		`SELECT EXISTS(SELECT 1 FROM reviews WHERE user_id = $1 AND restaurant_id = $2)`,
		userID, restaurantID).Scan(&exists)
	return exists, err
}

func (r *Repository) ListByRestaurant(ctx context.Context, restaurantID string, limit, offset int) ([]*domain.Review, int, error) {
	var total int
	if err := r.db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM reviews WHERE restaurant_id = $1`, restaurantID).Scan(&total); err != nil {
		return nil, 0, err
	}

	if limit <= 0 {
		limit = 20
	}

	rows, err := r.db.QueryContext(ctx,
		`SELECT id, user_id, restaurant_id, rating, comment, created_at
		 FROM reviews WHERE restaurant_id = $1
		 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
		restaurantID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var reviews []*domain.Review
	for rows.Next() {
		rv := &domain.Review{}
		if err := rows.Scan(&rv.ID, &rv.UserID, &rv.RestaurantID, &rv.Rating, &rv.Comment, &rv.CreatedAt); err != nil {
			return nil, 0, err
		}
		reviews = append(reviews, rv)
	}
	return reviews, total, rows.Err()
}
