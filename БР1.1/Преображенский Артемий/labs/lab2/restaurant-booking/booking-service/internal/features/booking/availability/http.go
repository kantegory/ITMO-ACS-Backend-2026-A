package availability

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"

	"restaurant-booking/booking-service/internal/domain"
	"restaurant-booking/booking-service/pkg/render"
)

func HTTP(usecase *Usecase) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		st, err := time.Parse(time.RFC3339, q.Get("start_time"))
		if err != nil {
			render.WriteDomainError(w, domain.ErrInvalidInput)
			return
		}
		et, err := time.Parse(time.RFC3339, q.Get("end_time"))
		if err != nil {
			render.WriteDomainError(w, domain.ErrInvalidInput)
			return
		}
		out, err := usecase.Check(r.Context(), Input{
			RestaurantID: chi.URLParam(r, "id"),
			TableID:      chi.URLParam(r, "tableID"),
			StartTime:    st,
			EndTime:      et,
		})
		if err != nil {
			render.WriteDomainError(w, err)
			return
		}
		if err := render.Write(w, http.StatusOK, out); err != nil {
			render.WriteError(w, http.StatusInternalServerError)
		}
	}
}
