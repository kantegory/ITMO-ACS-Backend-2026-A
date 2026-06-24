package handler

import (
"encoding/json"
"log"
"net/http"

"job-search-api/internal/model"
"job-search-api/internal/repository"
)

type CategoriesHandler struct {
repos *repository.Repositories
}

func NewCategoriesHandler(repos *repository.Repositories) *CategoriesHandler {
return &CategoriesHandler{repos: repos}
}

// ListCategories возвращает список всех категорий (публичный)
func (h *CategoriesHandler) ListCategories(w http.ResponseWriter, r *http.Request) {
categories, err := h.repos.Categories.List(r.Context())
if err != nil {
log.Printf("List categories error: %v", err)
http.Error(w, `{"error":"Failed to fetch categories"}`, http.StatusInternalServerError)
return
}

if categories == nil {
categories = []model.Category{}
}

w.Header().Set("Content-Type", "application/json")
json.NewEncoder(w).Encode(categories)
}
