package create

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	"restaurant-booking/catalog-service/internal/domain"
	"restaurant-booking/catalog-service/pkg/render"
)

func HTTP(usecase *Usecase) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body Body
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			render.WriteDomainError(w, domain.ErrInvalidInput)
			return
		}

		out, err := usecase.Create(r.Context(), Input{
			RestaurantID: chi.URLParam(r, "id"),
			Body:         body,
		})
		if err != nil {
			render.WriteDomainError(w, err)
			return
		}

		if err := render.Write(w, http.StatusCreated, out); err != nil {
			render.WriteError(w, http.StatusInternalServerError)
		}
	}
}
