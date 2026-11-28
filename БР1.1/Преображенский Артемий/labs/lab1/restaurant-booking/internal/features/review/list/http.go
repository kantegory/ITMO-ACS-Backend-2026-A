package list

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"restaurant-booking/pkg/render"
)

func HTTP(usecase *Usecase) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		out, err := usecase.List(r.Context(), Input{RestaurantID: chi.URLParam(r, "id")})
		if err != nil {
			render.WriteDomainError(w, err)
			return
		}
		if err := render.Write(w, http.StatusOK, out); err != nil {
			render.WriteError(w, http.StatusInternalServerError)
		}
	}
}
