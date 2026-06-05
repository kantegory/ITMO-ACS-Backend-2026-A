package list

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"restaurant-booking/catalog-service/pkg/render"
)

func HTTP(usecase *Usecase) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		proteinsMin, err := parseOptionalFloat(q.Get("proteins_min"))
		if err != nil {
			render.WriteError(w, http.StatusBadRequest)
			return
		}
		proteinsMax, err := parseOptionalFloat(q.Get("proteins_max"))
		if err != nil {
			render.WriteError(w, http.StatusBadRequest)
			return
		}
		fatsMin, err := parseOptionalFloat(q.Get("fats_min"))
		if err != nil {
			render.WriteError(w, http.StatusBadRequest)
			return
		}
		fatsMax, err := parseOptionalFloat(q.Get("fats_max"))
		if err != nil {
			render.WriteError(w, http.StatusBadRequest)
			return
		}
		carbsMin, err := parseOptionalFloat(q.Get("carbs_min"))
		if err != nil {
			render.WriteError(w, http.StatusBadRequest)
			return
		}
		carbsMax, err := parseOptionalFloat(q.Get("carbs_max"))
		if err != nil {
			render.WriteError(w, http.StatusBadRequest)
			return
		}

		out, err := usecase.List(r.Context(), Input{
			RestaurantID: chi.URLParam(r, "id"),
			ProteinsMin:  proteinsMin,
			ProteinsMax:  proteinsMax,
			FatsMin:      fatsMin,
			FatsMax:      fatsMax,
			CarbsMin:     carbsMin,
			CarbsMax:     carbsMax,
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

func parseOptionalFloat(raw string) (*float64, error) {
	if raw == "" {
		return nil, nil
	}
	v, err := strconv.ParseFloat(raw, 64)
	if err != nil {
		return nil, err
	}
	return &v, nil
}
