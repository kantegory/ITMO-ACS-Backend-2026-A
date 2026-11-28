package create

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5/pgconn"

	"restaurant-booking/internal/adapter/postgres"
	"restaurant-booking/internal/domain"
)

type postgresRepository struct {
	pool *postgres.Pool
}

func NewPostgres(pool *postgres.Pool) *postgresRepository {
	return &postgresRepository{pool: pool}
}

func (r *postgresRepository) Create(ctx context.Context, item domain.Dish) (domain.Dish, error) {
	var out domain.Dish
	var price float64
	err := r.pool.Pgx().QueryRow(ctx, `
		INSERT INTO menu_items (
			restaurant_id, name, description, price, category, is_available,
			pfc_proteins, pfc_fats, pfc_carbs
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, restaurant_id, name, description, price::float8, category, is_available, pfc_proteins::float8, pfc_fats::float8, pfc_carbs::float8
	`, item.RestaurantID, item.Name, item.Description, float64(item.Price), string(item.Category), item.IsAvailable, item.Proteins, item.Fats, item.Carbs).Scan(
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
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23503" {
			return domain.Dish{}, domain.ErrNotFound
		}
		return domain.Dish{}, err
	}
	out.Price = domain.Price(price)
	return out, nil
}
