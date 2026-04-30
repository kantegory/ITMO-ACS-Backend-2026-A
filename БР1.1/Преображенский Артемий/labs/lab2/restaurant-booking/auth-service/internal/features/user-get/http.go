package userget

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"restaurant-booking/auth-service/internal/domain"
	"restaurant-booking/auth-service/pkg/render"
)

func HTTP(usecase *Usecase) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, err := uuid.Parse(chi.URLParam(r, "id"))
		if err != nil {
			render.WriteDomainError(w, domain.ErrInvalidInput)
			return
		}
		out, err := usecase.Get(r.Context(), Input{UserID: id})
		if err != nil {
			render.WriteDomainError(w, err)
			return
		}
		if err := render.Write(w, http.StatusOK, out.User); err != nil {
			render.WriteError(w, http.StatusInternalServerError)
		}
	}
}
