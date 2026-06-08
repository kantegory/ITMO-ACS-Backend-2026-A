package list

import (
	"net/http"
	"restaurant-booking/internal/domain"
	"restaurant-booking/pkg/render"
)

func HTTP(usecase *Usecase) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		input := Input{
			City:          domain.City(q.Get("city")),
			CuisineType:   domain.CuisineType(q.Get("cuisine_type")),
			PriceCategory: domain.PriceCategory(q.Get("price_category")),
		}

		out, err := usecase.List(r.Context(), input)
		if err != nil {
			render.WriteDomainError(w, err)
			return
		}

		if err := render.Write(w, http.StatusOK, out); err != nil {
			render.WriteError(w, http.StatusInternalServerError)
			return
		}
	}
}
