package handler

import (
	"review/internal/models"
	"review/internal/repository"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type ReviewHandler struct {
	repo *repository.ReviewRepository
}

func NewReviewHandler(repo *repository.ReviewRepository) *ReviewHandler {
	return &ReviewHandler{repo: repo}
}

func (h *ReviewHandler) Create(w http.ResponseWriter, r *http.Request) {
	var rev models.Review
	if err := json.NewDecoder(r.Body).Decode(&rev); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	uid, _ := strconv.Atoi(r.Header.Get("X-User-Id"))
	rev.UserID = uid

	if err := h.repo.CreateReview(&rev); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(rev)
}

func (h *ReviewHandler) GetByRestaurant(w http.ResponseWriter, r *http.Request) {
	resID, _ := strconv.Atoi(chi.URLParam(r, "id"))
	reviews, err := h.repo.GetByRestaurant(resID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(reviews)
}
