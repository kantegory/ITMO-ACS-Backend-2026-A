package reviewrepo

import (
	"context"
	"database/sql"
	"strings"

	"github.com/borodin-maksim/restaurant-booking/internal/domain"
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
	_, err := r.db.ExecContext(ctx, query, rv.ID, rv.UserID, rv.RestaurantID, rv.Rating, rv.Comment, rv.CreatedAt)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "unique constraint") {
			return domain.ErrReviewAlreadyExists
		}
		return err
	}
	return nil
}

func (r *Repository) ListByRestaurant(ctx context.Context, restaurantID string, limit, offset int) ([]*domain.Review, int, error) {
	if limit <= 0 {
		limit = 20
	}

	var total int
	if err := r.db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM reviews WHERE restaurant_id = $1`, restaurantID,
	).Scan(&total); err != nil {
		return nil, 0, err
	}

	const query = `SELECT id, user_id, restaurant_id, rating, COALESCE(comment,''), created_at
	               FROM reviews WHERE restaurant_id = $1
	               ORDER BY created_at DESC
	               LIMIT $2 OFFSET $3`
	rows, err := r.db.QueryContext(ctx, query, restaurantID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var list []*domain.Review
	for rows.Next() {
		rv := &domain.Review{}
		if err := rows.Scan(&rv.ID, &rv.UserID, &rv.RestaurantID, &rv.Rating, &rv.Comment, &rv.CreatedAt); err != nil {
			return nil, 0, err
		}
		list = append(list, rv)
	}
	return list, total, rows.Err()
}

func (r *Repository) ExistsByUserAndRestaurant(ctx context.Context, userID, restaurantID string) (bool, error) {
	var exists bool
	err := r.db.QueryRowContext(ctx,
		`SELECT EXISTS(SELECT 1 FROM reviews WHERE user_id = $1 AND restaurant_id = $2)`,
		userID, restaurantID,
	).Scan(&exists)
	return exists, err
}
