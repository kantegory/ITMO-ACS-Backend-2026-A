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
	repo    *repository.BookingRepository
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

	w.Header().Set("Content-Type", "application/json")
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

// GET internal/restaurant/{id}/busy-tables?date&startTime&endTime
func (h *BookingHandler) GetInternalBusyTables(w http.ResponseWriter, r *http.Request) {
	resID, _ := strconv.Atoi(chi.URLParam(r, "id"))
	dateStr := r.URL.Query().Get("date")
	startTimeStr := r.URL.Query().Get("startTime");
	endTimeStr := r.URL.Query().Get("endTime");

	if dateStr == "" {
		http.Error(w, "date parameter is required", http.StatusBadRequest)
		return
	}
	if startTimeStr == "" {
		http.Error(w, "startTime parameter is required", http.StatusBadRequest)
		return
	}
	if endTimeStr == "" {
		http.Error(w, "endTime parameter is required", http.StatusBadRequest)
		return
	}
	timestampLayout := "2006-01-02 15:05"
	_, err := time.Parse(timestampLayout, dateStr + " " + startTimeStr)
	if err != nil {
		http.Error(w, "Invalid timestamp format for Start time, expected YYYY-MM-DD HH:MM", http.StatusBadRequest)
		return
	}
	_, err = time.Parse(timestampLayout, dateStr + " " + endTimeStr)
	if err != nil {
		http.Error(w, "Invalid timestamp format for End time, expected YYYY-MM-DD HH:MM", http.StatusBadRequest)
		return
	}

	tables, err := h.repo.GetBusyTableIDs(resID, dateStr, startTimeStr, endTimeStr)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(tables)
}
