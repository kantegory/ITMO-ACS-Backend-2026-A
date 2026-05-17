package handler

import (
	"booking/internal/client"
	"booking/internal/models"
	"booking/internal/repository"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
)

type BookingHandler struct {
	repo *repository.BookingRepository
	catalog *client.CatalogClient
}

func NewBookingHandler(r *repository.BookingRepository, c *client.CatalogClient) *BookingHandler {
	return &BookingHandler{repo: r, catalog: c}
}

// POST /bookings
func (h *BookingHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.Booking
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	userIDStr := r.Header.Get("X-User-Id")
	userID, _ := strconv.Atoi(userIDStr)
	req.UserID = userID
	reqID := r.Header.Get("X-Request-Id")

	tableInfo, err := h.catalog.GetTableInfo(req.TableID, reqID)
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

// GET /bookings
func (h *BookingHandler) Get(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.Header.Get("X-User-Id")
	userID, _ := strconv.Atoi(userIDStr)

	var bookings []models.Booking
	bookings, err := h.repo.GetUserBookings(userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(bookings)
}

// GET internal/restaurant/{id}/busy-tables?date
func (h *BookingHandler) GetInternalBusyTables(w http.ResponseWriter, r *http.Request) {
	resID, _ := strconv.Atoi(chi.URLParam(r, "id"))
 	dateStr := r.URL.Query().Get("date")

	if dateStr == "" {
		http.Error(w, "date parameter is required", http.StatusBadRequest)
		return
	}
	_, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		http.Error(w, "Invalid date format, expected YYYY-MM-DD", http.StatusBadRequest)
		return
	}

	tables, err := h.repo.GetBusyTableIDs(resID, dateStr)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(tables)
}
