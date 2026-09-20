package create

import (
	"context"

	"restaurant-booking/catalog-service/internal/adapter/postgres"
	"restaurant-booking/catalog-service/internal/domain"
)

type postgresRepository struct {
	pool *postgres.Pool
}

func NewPostgres(pool *postgres.Pool) *postgresRepository {
	return &postgresRepository{pool: pool}
}

func (r *postgresRepository) Create(ctx context.Context, restaurant domain.Restaurant) (domain.Restaurant, error) {
	photos := make([]string, len(restaurant.Photos))
	for i, p := range restaurant.Photos {
		photos[i] = string(p)
	}

	var result domain.Restaurant
	var outPhotos []string
	err := r.pool.Pgx().QueryRow(ctx, `
		INSERT INTO restaurants (name, description, city, address, cuisine_type, price_category, photos)
		VALUES ($1, $2, $3, $4, $5::cuisine_type, $6::price_category, $7)
		RETURNING id, name, description, city, address, cuisine_type::text, price_category::text, created_at, COALESCE(photos, ARRAY[]::text[])
	`, restaurant.Name, restaurant.Description, string(restaurant.City), string(restaurant.Address), string(restaurant.CuisineType), string(restaurant.PriceCategory), photos).Scan(
		&result.ID,
		&result.Name,
		&result.Description,
		&result.City,
		&result.Address,
		&result.CuisineType,
		&result.PriceCategory,
		&result.CreatedAt,
		&outPhotos,
	)
	if err != nil {
		return domain.Restaurant{}, err
	}
	result.Photos = make([]domain.URL, len(outPhotos))
	for i, p := range outPhotos {
		result.Photos[i] = domain.URL(p)
	}
	return result, nil
}
