package delete

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"restaurant-booking/catalog-service/pkg/render"
)

func HTTP(usecase *Usecase) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		err := usecase.Delete(r.Context(), Input{
			RestaurantID: chi.URLParam(r, "id"),
			TableID:      chi.URLParam(r, "tableID"),
		})
		if err != nil {
			render.WriteDomainError(w, err)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	}
}
