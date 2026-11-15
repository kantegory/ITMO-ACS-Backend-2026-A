package handler

import (
	"net/http"

	"job-search-api/internal/repository"
)

type ApplicantsHandler struct {
	repos *repository.Repositories
}


func (h *ApplicantsHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	// TODO: Реализуем SQL-запрос и возврат JSON на следующем шаге
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Applicant profile endpoint"}`))
}


func (h *ApplicantsHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Profile updated"}`))
}