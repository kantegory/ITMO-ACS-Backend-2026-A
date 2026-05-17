package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"job-search-api/internal/middleware"
	"job-search-api/internal/model"
	"job-search-api/internal/repository"
)

type VacanciesHandler struct {
	repos *repository.Repositories
}

func NewVacanciesHandler(repos *repository.Repositories) *VacanciesHandler {
	return &VacanciesHandler{repos: repos}
}


func (h *VacanciesHandler) CreateVacancy(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetClaimsFromContext(r.Context())
	if !ok || claims.Role != "employer" {
		http.Error(w, `{"error":"Forbidden"}`, http.StatusForbidden)
		return
	}

	var req model.Vacancy
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request"}`, http.StatusBadRequest)
		return
	}

	if req.Title == "" || req.Description == "" {
		http.Error(w, `{"error":"Title and description are required"}`, http.StatusBadRequest)
		return
	}

	employerID, err := h.repos.Users.GetEmployerIDByUserID(r.Context(), claims.UserID)
	if err != nil {
	
		employerID, err = h.repos.Users.CreateEmployerIfNeeded(r.Context(), claims.UserID)
		if err != nil {
			log.Printf("Failed to create employer profile: %v", err)
			http.Error(w, `{"error":"Failed to setup employer profile"}`, http.StatusInternalServerError)
			return
		}
	}

	req.EmployerID = employerID
	req.IsActive = true

	vacancy, err := h.repos.Vacancies.Create(r.Context(), &req)
	if err != nil {
		log.Printf("Create vacancy error: %v", err)
		http.Error(w, `{"error":"Failed to create vacancy"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(vacancy)
}


func (h *VacanciesHandler) ListVacancies(w http.ResponseWriter, r *http.Request) {
	limit := 20
	offset := 0

	if l := r.URL.Query().Get("limit"); l != "" {
		if val, err := strconv.Atoi(l); err == nil && val > 0 {
			limit = val
		}
	}
	if o := r.URL.Query().Get("offset"); o != "" {
		if val, err := strconv.Atoi(o); err == nil && val >= 0 {
			offset = val
		}
	}

	vacancies, err := h.repos.Vacancies.List(r.Context(), limit, offset)
	if err != nil {
		log.Printf("List vacancies error: %v", err)
		http.Error(w, `{"error":"Failed to fetch vacancies"}`, http.StatusInternalServerError)
		return
	}

	if vacancies == nil {
		vacancies = []model.Vacancy{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(vacancies)
}


func (h *VacanciesHandler) GetVacancyByID(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, `{"error":"Invalid vacancy ID"}`, http.StatusBadRequest)
		return
	}

	vacancy, err := h.repos.Vacancies.GetByID(r.Context(), id)
	if err != nil {
		log.Printf("Get vacancy by ID error: %v", err)
		http.Error(w, `{"error":"Vacancy not found"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(vacancy)
}