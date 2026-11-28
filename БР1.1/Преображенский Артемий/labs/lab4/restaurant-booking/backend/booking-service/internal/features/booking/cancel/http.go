package cancel

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"restaurant-booking/booking-service/pkg/middleware"
	"restaurant-booking/booking-service/pkg/render"
)

func HTTP(usecase *Usecase) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		uid, ok := middleware.UserID(r.Context())
		if !ok {
			render.WriteError(w, http.StatusUnauthorized)
			return
		}
		err := usecase.Cancel(r.Context(), Input{
			UserID:    uid,
			BookingID: chi.URLParam(r, "bookingID"),
		})
		if err != nil {
			render.WriteDomainError(w, err)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	}
}
