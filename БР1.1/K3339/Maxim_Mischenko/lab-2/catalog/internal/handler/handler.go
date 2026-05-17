package handler

import (
	"catalog/internal/repository"
	"encoding/json"
	"net/http"
	"strconv"
	"github.com/go-chi/chi/v5"
)

type CatalogHandler struct {
	repo *repository.CatalogRepository
}

func NewCatalogHandler(repo *repository.CatalogRepository) *CatalogHandler {
	return &CatalogHandler{repo: repo}
}

// GET /restaurants
func (h *CatalogHandler) ListRestaurants(w http.ResponseWriter, r *http.Request) {
	city := r.URL.Query().Get("city")
	cuisineID, _ := strconv.Atoi(r.URL.Query().Get("cuisine_id"))

	restaurants, err := h.repo.GetRestaurants(city, cuisineID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(restaurants)
}

// GET /restaurants/{id}
func (h *CatalogHandler) GetRestaurant(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))

	res, err := h.repo.GetRestaurantByID(id)
	if err != nil {
		http.Error(w, "Restaurant not found", http.StatusNotFound)
		return
	}

	// Find details for the restaurant (menu + tables)
	// 1. Get restaurant info
	// 2. Get menu items
	// 3. Get reviews
	json.NewEncoder(w).Encode(res)
}

// GET /internal/tables/{id}
func (h *CatalogHandler) InternalGetTable(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	table, err := h.repo.GetTableByID(id)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(table)
}
