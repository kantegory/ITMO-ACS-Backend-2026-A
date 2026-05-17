package handler

import (
	"catalog/internal/models"
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
	q := r.URL.Query()

	limit, _ := strconv.Atoi(q.Get("limit"))
	if limit <= 0 { limit = 20 }

	offset, _ := strconv.Atoi(q.Get("offset"))
	cuisineID, _ := strconv.Atoi(q.Get("cuisine_id"))
	minPrice, _ := strconv.ParseFloat(q.Get("min_price"), 64)
	maxPrice, _ := strconv.ParseFloat(q.Get("max_price"), 64)

	filters := models.RestaurantFilters{
		Name: q.Get("name"),
		City: q.Get("city"),
		CuisineID: cuisineID,
		MinPrice: minPrice,
		MaxPrice: maxPrice,
		SortBy: q.Get("sort_by"),
		Limit: limit,
		Offset: offset,
	}

	response, err := h.repo.GetRestaurants(filters)
	if err != nil {
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
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

// POST /internal/restaurants/{id}/rating
func (h *CatalogHandler) InternalUpdateRestaurantRating(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))

	var input struct {
		Avg float64 `json:"avg_rating"`
		Count int `json:"reviews_count"`
	}
	json.NewDecoder(r.Body).Decode(&input)

	err := h.repo.UpdateRestaurantRating(id, input.Avg, input.Count)
	if err != nil {
		http.Error(w, "Interval error", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}
