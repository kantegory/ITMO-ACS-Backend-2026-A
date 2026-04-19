package menurepo

import (
	"context"
	"database/sql"

	"github.com/borodin-maksim/restaurant-booking/internal/domain"
)

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) ListMenuByRestaurant(ctx context.Context, restaurantID string) ([]*domain.MenuItem, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, restaurant_id, name, COALESCE(description,''), price, COALESCE(category,'')
		 FROM menu_items WHERE restaurant_id = $1 ORDER BY category, name`,
		restaurantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []*domain.MenuItem
	for rows.Next() {
		m := &domain.MenuItem{}
		if err := rows.Scan(&m.ID, &m.RestaurantID, &m.Name, &m.Description, &m.Price, &m.Category); err != nil {
			return nil, err
		}
		items = append(items, m)
	}
	return items, rows.Err()
}
