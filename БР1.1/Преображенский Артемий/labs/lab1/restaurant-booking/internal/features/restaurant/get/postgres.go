package get

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"restaurant-booking/internal/adapter/postgres"
	"restaurant-booking/internal/domain"
)

type postgresRepository struct {
	pool *postgres.Pool
}

func NewPostgres(pool *postgres.Pool) *postgresRepository {
	return &postgresRepository{pool: pool}
}

func (r *postgresRepository) Get(ctx context.Context, id uuid.UUID) (domain.Restaurant, error) {
	var restaurantID uuid.UUID
	var name, description, city, address, cuisineType, priceCategory string
	var createdAt time.Time
	var photos []string

	const query = `
SELECT
	r.id,
	r.name,
	r.description,
	r.city,
	r.address,
	r.cuisine_type::text,
	r.price_category::text,
	r.created_at,
	COALESCE(r.photos, ARRAY[]::text[])
FROM restaurants r
WHERE r.id = $1
LIMIT 1
`
	err := r.pool.Pgx().QueryRow(ctx, query, id).Scan(
		&restaurantID,
		&name,
		&description,
		&city,
		&address,
		&cuisineType,
		&priceCategory,
		&createdAt,
		&photos,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Restaurant{}, domain.ErrNotFound
		}
		return domain.Restaurant{}, err
	}

	urls := make([]domain.URL, len(photos))
	for i, ph := range photos {
		urls[i] = domain.URL(ph)
	}

	return domain.Restaurant{
		ID:            restaurantID,
		Name:          name,
		Description:   description,
		City:          domain.City(city),
		Address:       domain.Address(address),
		Photos:        urls,
		CreatedAt:     createdAt,
		PriceCategory: domain.PriceCategory(priceCategory),
		CuisineType:   domain.CuisineType(cuisineType),
	}, nil
}
