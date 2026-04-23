package get

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
		out, err := usecase.Get(r.Context(), Input{UserID: uid, BookingID: chi.URLParam(r, "bookingID")})
		if err != nil {
			render.WriteDomainError(w, err)
			return
		}
		if err := render.Write(w, http.StatusOK, out); err != nil {
			render.WriteError(w, http.StatusInternalServerError)
		}
	}
}
