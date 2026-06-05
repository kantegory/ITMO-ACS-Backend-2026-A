package availability

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"restaurant-booking/pkg/render"
)

func HTTP(usecase *Usecase) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		out, err := usecase.Check(r.Context(), Input{
			RestaurantID: chi.URLParam(r, "id"),
			TableID:      chi.URLParam(r, "tableID"),
			BookingDate:  q.Get("booking_date"),
			StartTime:    q.Get("start_time"),
			EndTime:      q.Get("end_time"),
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
