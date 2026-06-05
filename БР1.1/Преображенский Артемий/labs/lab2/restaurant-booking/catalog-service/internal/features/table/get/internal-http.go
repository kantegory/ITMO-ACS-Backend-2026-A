package get

import (
	"context"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"restaurant-booking/catalog-service/internal/adapter/postgres"
	"restaurant-booking/catalog-service/internal/domain"
	"restaurant-booking/catalog-service/pkg/render"
)

type Response struct {
	ID           uuid.UUID `json:"id"`
	RestaurantID uuid.UUID `json:"restaurant_id"`
	TableNumber  int       `json:"table_number"`
	SeatsCount   int       `json:"seats_count"`
}

func InternalHTTP(pool *postgres.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		restaurantID, err := uuid.Parse(chi.URLParam(r, "restaurantID"))
		if err != nil {
			render.WriteDomainError(w, domain.ErrInvalidInput)
			return
		}
		tableID, err := uuid.Parse(chi.URLParam(r, "tableID"))
		if err != nil {
			render.WriteDomainError(w, domain.ErrInvalidInput)
			return
		}
		resp, err := get(r.Context(), pool, restaurantID, tableID)
		if err != nil {
			render.WriteDomainError(w, err)
			return
		}
		if err := render.Write(w, http.StatusOK, resp); err != nil {
			render.WriteError(w, http.StatusInternalServerError)
		}
	}
}

func get(ctx context.Context, pool *postgres.Pool, restaurantID uuid.UUID, tableID uuid.UUID) (Response, error) {
	var resp Response
	err := pool.Pgx().QueryRow(ctx, `
		SELECT id, restaurant_id, table_number, seats_count
		FROM restaurant_tables
		WHERE restaurant_id = $1 AND id = $2
	`, restaurantID, tableID).Scan(&resp.ID, &resp.RestaurantID, &resp.TableNumber, &resp.SeatsCount)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Response{}, domain.ErrNotFound
		}
		return Response{}, err
	}
	return resp, nil
}
