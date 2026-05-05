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
		var input Input
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			render.WriteDomainError(w, domain.ErrInvalidInput)
			return
		}
		input.UserID = uid
		input.RestaurantID = chi.URLParam(r, "id")
		out, err := usecase.Create(r.Context(), input)
		if err != nil {
			render.WriteDomainError(w, err)
			return
		}
		if err := render.Write(w, http.StatusCreated, out); err != nil {
			render.WriteError(w, http.StatusInternalServerError)
		}
	}
}
