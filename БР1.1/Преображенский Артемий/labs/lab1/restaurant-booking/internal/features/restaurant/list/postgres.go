package list

import (
	"context"
	"time"

	"github.com/google/uuid"

	"restaurant-booking/internal/adapter/postgres"
	"restaurant-booking/internal/domain"
)

type postgresRepository struct {
	pool *postgres.Pool
}

func NewPostgres(pool *postgres.Pool) *postgresRepository {
	return &postgresRepository{pool: pool}
}

func (r *postgresRepository) List(ctx context.Context, input Input) ([]domain.Restaurant, error) {
	rows, err := r.pool.Pgx().Query(ctx, `
SELECT
	r.id,
	r.name,
	r.description,
	r.city,
	r.address,
	r.cuisine_type::text,
	r.price_category::text,
	r.created_at,
	ARRAY[]::text[]
FROM restaurants r
WHERE ($1 = '' OR r.city = $1)
  AND ($2 = '' OR r.cuisine_type::text = $2)
  AND ($3 = '' OR r.price_category::text = $3)
ORDER BY r.created_at DESC
`, string(input.City), string(input.CuisineType), string(input.PriceCategory))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]domain.Restaurant, 0)

	for rows.Next() {
		var id uuid.UUID
		var name, description, city, addr, cuisine, priceCat string
		var createdAt time.Time
		var photos []string

		if err := rows.Scan(
			&id,
			&name,
			&description,
			&city,
			&addr,
			&cuisine,
			&priceCat,
			&createdAt,
			&photos,
		); err != nil {
			return nil, err
		}

		urls := make([]domain.URL, len(photos))
		for i, ph := range photos {
			urls[i] = domain.URL(ph)
		}

		out = append(out, domain.Restaurant{
			ID:            id,
			Name:          name,
			Description:   description,
			City:          domain.City(city),
			Address:       domain.Address(addr),
			Photos:        urls,
			CreatedAt:     createdAt,
			PriceCategory: domain.PriceCategory(priceCat),
			CuisineType:   domain.CuisineType(cuisine),
		})
	}

	return out, rows.Err()
}
