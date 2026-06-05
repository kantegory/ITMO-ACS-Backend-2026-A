package create

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"

	"restaurant-booking/catalog-service/internal/adapter/postgres"
	"restaurant-booking/catalog-service/internal/domain"
)

type postgresRepository struct {
	pool *postgres.Pool
}

func NewPostgres(pool *postgres.Pool) *postgresRepository {
	return &postgresRepository{pool: pool}
}

func (r *postgresRepository) Create(ctx context.Context, userID uuid.UUID, restaurantID uuid.UUID, rating int, text string, authorName string) (domain.Review, error) {
	t := strings.TrimSpace(text)
	if t == "" || rating < 1 || rating > 5 {
		return domain.Review{}, domain.ErrInvalidInput
	}
	var out domain.Review
	err := r.pool.Pgx().QueryRow(ctx, `
		INSERT INTO reviews (user_id, restaurant_id, rating, text, author_name)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, user_id, restaurant_id, rating, text, created_at, updated_at
	`, userID, restaurantID, rating, t, authorName).Scan(
		&out.ID,
		&out.UserID,
		&out.RestaurantID,
		&out.Rating,
		&out.Text,
		&out.CreatedAt,
		&out.UpdatedAt,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return domain.Review{}, domain.ErrConflict
		}
		if errors.As(err, &pgErr) && pgErr.Code == "23503" {
			return domain.Review{}, domain.ErrNotFound
		}
		return domain.Review{}, err
	}
	return out, nil
}
