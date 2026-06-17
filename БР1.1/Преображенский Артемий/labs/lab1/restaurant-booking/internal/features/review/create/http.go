package create

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	"restaurant-booking/internal/domain"
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
		var body Body
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			render.WriteDomainError(w, domain.ErrInvalidInput)
			return
		}
		in := Input{
			UserID:       uid,
			RestaurantID: chi.URLParam(r, "id"),
			Rating:       body.Rating,
			Text:         body.Text,
		}
		out, err := usecase.Create(r.Context(), in)
		if err != nil {
			render.WriteDomainError(w, err)
			return
		}
		if err := render.Write(w, http.StatusCreated, out); err != nil {
			render.WriteError(w, http.StatusInternalServerError)
		}
	}
}
