package delete

import (
	"net/http"
	"restaurant-booking/pkg/render"

	"github.com/go-chi/chi/v5"
)

func HTTP(usecase *Usecase) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		input := Input{
			ID: chi.URLParam(r, "id"),
		}
		out, err := usecase.Delete(r.Context(), input)
		if err != nil {
			render.WriteDomainError(w, err)
			return
		}
		if err := render.Write(w, http.StatusOK, out); err != nil {
			render.WriteError(w, http.StatusInternalServerError)
			return
		}
	}
}
