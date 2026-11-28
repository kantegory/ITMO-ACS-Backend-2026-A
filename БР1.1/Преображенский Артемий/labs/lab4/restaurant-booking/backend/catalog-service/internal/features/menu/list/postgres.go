package list

import (
	"context"

	"github.com/google/uuid"

	"restaurant-booking/catalog-service/internal/adapter/postgres"
	"restaurant-booking/catalog-service/internal/domain"
)

type postgresRepository struct {
	pool *postgres.Pool
}

func NewPostgres(pool *postgres.Pool) *postgresRepository {
	return &postgresRepository{pool: pool}
}

func (r *postgresRepository) ListByRestaurant(ctx context.Context, restaurantID uuid.UUID, proteinsMin *float64, proteinsMax *float64, fatsMin *float64, fatsMax *float64, carbsMin *float64, carbsMax *float64) ([]domain.Dish, error) {
	rows, err := r.pool.Pgx().Query(ctx, `
		SELECT
			id,
			restaurant_id,
			name,
			description,
			price::float8,
			category,
			is_available,
			pfc_proteins::float8,
			pfc_fats::float8,
			pfc_carbs::float8
		FROM menu_items
		WHERE restaurant_id = $1
			AND ($2::float8 IS NULL OR pfc_proteins::float8 >= $2::float8)
			AND ($3::float8 IS NULL OR pfc_proteins::float8 <= $3::float8)
			AND ($4::float8 IS NULL OR pfc_fats::float8 >= $4::float8)
			AND ($5::float8 IS NULL OR pfc_fats::float8 <= $5::float8)
			AND ($6::float8 IS NULL OR pfc_carbs::float8 >= $6::float8)
			AND ($7::float8 IS NULL OR pfc_carbs::float8 <= $7::float8)
		ORDER BY category, name
	`, restaurantID, proteinsMin, proteinsMax, fatsMin, fatsMax, carbsMin, carbsMax)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]domain.Dish, 0)
	for rows.Next() {
		var d domain.Dish
		var price float64
		if err := rows.Scan(
			&d.ID,
			&d.RestaurantID,
			&d.Name,
			&d.Description,
			&price,
			&d.Category,
			&d.IsAvailable,
			&d.Proteins,
			&d.Fats,
			&d.Carbs,
		); err != nil {
			return nil, err
		}
		d.Price = domain.Price(price)
		out = append(out, d)
	}
	return out, rows.Err()
}
