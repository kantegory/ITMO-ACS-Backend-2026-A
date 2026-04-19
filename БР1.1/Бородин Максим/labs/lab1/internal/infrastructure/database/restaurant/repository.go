package restaurantrepo

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"github.com/borodin-maksim/restaurant-booking/internal/domain"
)

type Filter struct {
	Cuisine    string
	Location   string
	PriceRange int
	Search     string
	Limit      int
	Offset     int
}

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Create(ctx context.Context, rest *domain.Restaurant) error {
	query := `INSERT INTO restaurants (id, name, description, cuisine_type, location, price_range, created_at)
	          VALUES ($1, $2, $3, $4, $5, $6, $7)`
	_, err := r.db.ExecContext(ctx, query,
		rest.ID, rest.Name, rest.Description, rest.CuisineType,
		rest.Location, rest.PriceRange, rest.CreatedAt,
	)
	return err
}

func (r *Repository) List(ctx context.Context, f Filter) ([]*domain.Restaurant, int, error) {
	args := []any{}
	conditions := []string{}
	i := 1

	if f.Cuisine != "" {
		conditions = append(conditions, fmt.Sprintf("r.cuisine_type ILIKE $%d", i))
		args = append(args, "%"+f.Cuisine+"%")
		i++
	}
	if f.Location != "" {
		conditions = append(conditions, fmt.Sprintf("r.location ILIKE $%d", i))
		args = append(args, "%"+f.Location+"%")
		i++
	}
	if f.PriceRange > 0 {
		conditions = append(conditions, fmt.Sprintf("r.price_range = $%d", i))
		args = append(args, f.PriceRange)
		i++
	}
	if f.Search != "" {
		conditions = append(conditions, fmt.Sprintf("r.name ILIKE $%d", i))
		args = append(args, "%"+f.Search+"%")
		i++
	}

	where := ""
	if len(conditions) > 0 {
		where = "WHERE " + strings.Join(conditions, " AND ")
	}

	countQuery := fmt.Sprintf(`SELECT COUNT(*) FROM restaurants r %s`, where)
	var total int
	if err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	limit := f.Limit
	if limit <= 0 {
		limit = 20
	}
	args = append(args, limit, f.Offset)

	query := fmt.Sprintf(`
		SELECT r.id, r.name, r.description, r.cuisine_type, r.location, r.price_range, r.created_at,
		       COALESCE(AVG(rv.rating), 0) as avg_rating
		FROM restaurants r
		LEFT JOIN reviews rv ON rv.restaurant_id = r.id
		%s
		GROUP BY r.id
		ORDER BY r.created_at DESC
		LIMIT $%d OFFSET $%d`, where, i, i+1)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var list []*domain.Restaurant
	for rows.Next() {
		rest := &domain.Restaurant{}
		if err := rows.Scan(
			&rest.ID, &rest.Name, &rest.Description, &rest.CuisineType,
			&rest.Location, &rest.PriceRange, &rest.CreatedAt, &rest.AvgRating,
		); err != nil {
			return nil, 0, err
		}
		list = append(list, rest)
	}
	return list, total, rows.Err()
}

func (r *Repository) GetByID(ctx context.Context, id string) (*domain.Restaurant, error) {
	query := `
		SELECT r.id, r.name, r.description, r.cuisine_type, r.location, r.price_range, r.created_at,
		       COALESCE(AVG(rv.rating), 0) as avg_rating
		FROM restaurants r
		LEFT JOIN reviews rv ON rv.restaurant_id = r.id
		WHERE r.id = $1
		GROUP BY r.id`

	rest := &domain.Restaurant{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&rest.ID, &rest.Name, &rest.Description, &rest.CuisineType,
		&rest.Location, &rest.PriceRange, &rest.CreatedAt, &rest.AvgRating,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}

	photos, err := r.getPhotos(ctx, id)
	if err != nil {
		return nil, err
	}
	rest.Photos = photos
	return rest, nil
}

func (r *Repository) getPhotos(ctx context.Context, restaurantID string) ([]string, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT photo_url FROM restaurant_photos WHERE restaurant_id = $1`, restaurantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var photos []string
	for rows.Next() {
		var url string
		if err := rows.Scan(&url); err != nil {
			return nil, err
		}
		photos = append(photos, url)
	}
	return photos, rows.Err()
}

func (r *Repository) ExistsByID(ctx context.Context, id string) (bool, error) {
	var exists bool
	err := r.db.QueryRowContext(ctx, `SELECT EXISTS(SELECT 1 FROM restaurants WHERE id = $1)`, id).Scan(&exists)
	return exists, err
}
