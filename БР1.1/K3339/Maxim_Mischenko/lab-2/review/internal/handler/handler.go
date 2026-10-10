package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"review/internal/client"
	"review/internal/models"
	"review/internal/repository"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type ReviewHandler struct {
	repo       *repository.ReviewRepository
	authClient *client.AuthClient
}

func NewReviewHandler(repo *repository.ReviewRepository, authClient *client.AuthClient) *ReviewHandler {
	return &ReviewHandler{repo: repo, authClient: authClient}
}

func (h *ReviewHandler) Create(w http.ResponseWriter, r *http.Request) {
	var rev models.Review
	if err := json.NewDecoder(r.Body).Decode(&rev); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	if rev.Rating < 1 || rev.Rating > 5 {
		http.Error(w, "Rating must be between 1 and 5", http.StatusBadRequest)
		return
	}

	uid, _ := strconv.Atoi(r.Header.Get("X-User-Id"))
	rev.UserID = uid

	if err := h.repo.CreateReview(&rev); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	rev.UserFullName = h.userName(rev.UserID)

	w.Header().Set("Content-Type", "application/json")
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

	for i := range reviews {
		reviews[i].UserFullName = h.userName(reviews[i].UserID)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(reviews)
}

func (h *ReviewHandler) userName(userID int) string {
	if h.authClient == nil {
		return ""
	}
	name, err := h.authClient.GetUserName(userID)
	if err != nil {
		log.Printf("Failed to resolve user %d: %v", userID, err)
		return ""
	}
	return name
}
