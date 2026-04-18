package handler

import (
	"net/http"
	"job-search-api/internal/repository"
)

type UsersHandler struct {
	repos *repository.Repositories
}

func (h *UsersHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]string{"message": "User Profile Stub"})
}

func (h *UsersHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
}