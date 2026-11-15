package handler

import (
	"net/http"
	"job-search-api/internal/repository"
)

type EmployersHandler struct {
	repos *repository.Repositories
}

func (h *EmployersHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]string{"message": "Employer Profile Stub"})
}

func (h *EmployersHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
}