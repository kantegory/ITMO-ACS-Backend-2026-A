package get

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"restaurant-booking/catalog-service/internal/adapter/postgres"
	"restaurant-booking/catalog-service/internal/domain"
)

type postgresRepository struct {
	pool *postgres.Pool
}

func NewPostgres(pool *postgres.Pool) *postgresRepository {
	return &postgresRepository{pool: pool}
}

func (r *postgresRepository) GetByRestaurantAndID(ctx context.Context, restaurantID uuid.UUID, itemID uuid.UUID) (domain.Dish, error) {
	var out domain.Dish
	var price float64
	err := r.pool.Pgx().QueryRow(ctx, `
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
		WHERE restaurant_id = $1 AND id = $2
		LIMIT 1
	`, restaurantID, itemID).Scan(
		&out.ID,
		&out.RestaurantID,
		&out.Name,
		&out.Description,
		&price,
		&out.Category,
		&out.IsAvailable,
		&out.Proteins,
		&out.Fats,
		&out.Carbs,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Dish{}, domain.ErrNotFound
		}
		return domain.Dish{}, err
	}
	out.Price = domain.Price(price)
	return out, nil
}
