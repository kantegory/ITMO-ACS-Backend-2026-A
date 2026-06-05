package register

import (
	"encoding/json"
	"net/http"

	"restaurant-booking/internal/domain"
	"restaurant-booking/pkg/render"
)

func HTTP(usecase *Usecase) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var input Input
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			render.WriteDomainError(w, domain.ErrInvalidInput)
			return
		}
		out, err := usecase.Register(r.Context(), input)
		if err != nil {
			render.WriteDomainError(w, err)
			return
		}
		if err := render.Write(w, http.StatusCreated, out); err != nil {
			render.WriteError(w, http.StatusInternalServerError)
		}
	}
}
