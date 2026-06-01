package tablerepo

import (
	"context"
	"database/sql"
	"errors"
	"strings"

	"github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/domain"
)

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Create(ctx context.Context, t *domain.Table) error {
	query := `INSERT INTO tables (id, restaurant_id, table_number, capacity)
	          VALUES ($1, $2, $3, $4)`
	_, err := r.db.ExecContext(ctx, query, t.ID, t.RestaurantID, t.TableNumber, t.Capacity)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") {
			return errors.New("table number already exists in this restaurant")
		}
		return err
	}
	return nil
}

func (r *Repository) GetByID(ctx context.Context, id string) (*domain.Table, error) {
	query := `SELECT id, restaurant_id, table_number, capacity FROM tables WHERE id = $1`
	t := &domain.Table{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(&t.ID, &t.RestaurantID, &t.TableNumber, &t.Capacity)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return t, nil
}

func (r *Repository) ListByRestaurant(ctx context.Context, restaurantID string) ([]*domain.Table, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, restaurant_id, table_number, capacity FROM tables WHERE restaurant_id = $1 ORDER BY table_number`,
		restaurantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tables []*domain.Table
	for rows.Next() {
		t := &domain.Table{}
		if err := rows.Scan(&t.ID, &t.RestaurantID, &t.TableNumber, &t.Capacity); err != nil {
			return nil, err
		}
		tables = append(tables, t)
	}
	return tables, rows.Err()
}
