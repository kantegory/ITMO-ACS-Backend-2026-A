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
	ID   uuid.UUID `json:"id"`
	Name string    `json:"name"`
	City string    `json:"city"`
}

func InternalHTTP(pool *postgres.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, err := uuid.Parse(chi.URLParam(r, "id"))
		if err != nil {
			render.WriteDomainError(w, domain.ErrInvalidInput)
			return
		}
		resp, err := get(r.Context(), pool, id)
		if err != nil {
			render.WriteDomainError(w, err)
			return
		}
		if err := render.Write(w, http.StatusOK, resp); err != nil {
			render.WriteError(w, http.StatusInternalServerError)
		}
	}
}

func get(ctx context.Context, pool *postgres.Pool, id uuid.UUID) (Response, error) {
	var resp Response
	err := pool.Pgx().QueryRow(ctx, `
		SELECT id, name, city FROM restaurants WHERE id = $1
	`, id).Scan(&resp.ID, &resp.Name, &resp.City)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Response{}, domain.ErrNotFound
		}
		return Response{}, err
	}
	return resp, nil
}
