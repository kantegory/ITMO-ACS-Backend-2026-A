package delete

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"restaurant-booking/pkg/middleware"
	"restaurant-booking/pkg/render"
)

func HTTP(usecase *Usecase) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		uid, ok := middleware.UserID(r.Context())
		if !ok {
			render.WriteError(w, http.StatusUnauthorized)
			return
		}
		err := usecase.Delete(r.Context(), Input{
			UserID:       uid,
			RestaurantID: chi.URLParam(r, "id"),
			ReviewID:     chi.URLParam(r, "reviewID"),
		})
		if err != nil {
			render.WriteDomainError(w, err)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	}
}
