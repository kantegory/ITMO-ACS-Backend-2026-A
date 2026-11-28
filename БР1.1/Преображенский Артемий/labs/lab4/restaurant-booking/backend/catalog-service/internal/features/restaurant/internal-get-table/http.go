package internalgettable

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"restaurant-booking/catalog-service/internal/domain"
	"restaurant-booking/catalog-service/pkg/render"
)

func HTTP(usecase *Usecase) http.HandlerFunc {
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
		out, err := usecase.Get(r.Context(), Input{RestaurantID: restaurantID, TableID: tableID})
		if err != nil {
			render.WriteDomainError(w, err)
			return
		}
		if err := render.Write(w, http.StatusOK, out.Table); err != nil {
			render.WriteError(w, http.StatusInternalServerError)
		}
	}
}
