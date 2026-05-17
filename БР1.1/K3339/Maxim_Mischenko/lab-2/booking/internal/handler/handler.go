package handler

import (
	"booking/internal/client"
	"booking/internal/models"
	"booking/internal/repository"
	"encoding/json"
	"net/http"
	"strconv"
)

type BookingHandler struct {
	repo *repository.BookingRepository
	catalog *client.CatalogClient
}

func NewBookingHandler(r *repository.BookingRepository, c *client.CatalogClient) *BookingHandler {
	return &BookingHandler{repo: r, catalog: c}
}

func (h *BookingHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.Booking
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	userIDStr := r.Header.Get("X-User-Id")
	userID, _ := strconv.Atoi(userIDStr)
	req.UserID = userID

	tableInfo, err := h.catalog.GetTableInfo(req.TableID)
	if err != nil {
		http.Error(w, "Invalid table or service error", http.StatusBadRequest)
		return
	}

	if req.GuestsCount > tableInfo.Capacity {
		http.Error(w, "Guests count exceeds table capacity", http.StatusUnprocessableEntity)
		return
	}

	busy, _ := h.repo.IsTableBusy(req.TableID, req.BookingDate, req.StartTime, req.EndTime)
	if busy {
		http.Error(w, "Table already booked for this time", http.StatusConflict)
		return
	}

	err = h.repo.CreateBooking(&req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(req)
}
