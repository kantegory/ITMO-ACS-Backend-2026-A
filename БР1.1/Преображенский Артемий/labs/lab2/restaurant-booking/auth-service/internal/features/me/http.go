package me

import (
	"net/http"

	"restaurant-booking/auth-service/pkg/middleware"
	"restaurant-booking/auth-service/pkg/render"
)

func HTTP(usecase *Usecase) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		uid, ok := middleware.UserID(r.Context())
		if !ok {
			render.WriteError(w, http.StatusUnauthorized)
			return
		}
		out, err := usecase.Me(r.Context(), Input{UserID: uid})
		if err != nil {
			render.WriteDomainError(w, err)
			return
		}
		if err := render.Write(w, http.StatusOK, out.User); err != nil {
			render.WriteError(w, http.StatusInternalServerError)
		}
	}
}
