package handler

import (
	"net/http"
	"job-search-api/internal/repository"
)

type WorkExperienceHandler struct {
	repos *repository.Repositories
}

func (h *WorkExperienceHandler) List(w http.ResponseWriter, r *http.Request)    { w.WriteHeader(http.StatusOK) }
func (h *WorkExperienceHandler) Create(w http.ResponseWriter, r *http.Request)  { w.WriteHeader(http.StatusOK) }
func (h *WorkExperienceHandler) GetByID(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) }
func (h *WorkExperienceHandler) Update(w http.ResponseWriter, r *http.Request)  { w.WriteHeader(http.StatusOK) }
func (h *WorkExperienceHandler) Delete(w http.ResponseWriter, r *http.Request)  { w.WriteHeader(http.StatusOK) }