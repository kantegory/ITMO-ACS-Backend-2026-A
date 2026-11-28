package create

import (
	"encoding/json"
	"net/http"

	"restaurant-booking/catalog-service/internal/domain"
	"restaurant-booking/catalog-service/pkg/middleware"
	"restaurant-booking/catalog-service/pkg/render"
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

		out, err := usecase.Create(r.Context(), Input{UserID: uid, Body: body})
		if err != nil {
			render.WriteDomainError(w, err)
			return
		}

		if err := render.Write(w, http.StatusCreated, out); err != nil {
			render.WriteError(w, http.StatusInternalServerError)
		}
	}
}
