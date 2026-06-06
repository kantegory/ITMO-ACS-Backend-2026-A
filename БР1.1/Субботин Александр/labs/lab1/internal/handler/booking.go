package handler

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/ZZISST/rental-api/internal/middleware"
	"github.com/ZZISST/rental-api/internal/model"
	"github.com/ZZISST/rental-api/internal/repository"
)

type BookingHandler struct {
	bookingRepo  *repository.BookingRepository
	propertyRepo *repository.PropertyRepository
}

func NewBookingHandler(bookingRepo *repository.BookingRepository, propertyRepo *repository.PropertyRepository) *BookingHandler {
	return &BookingHandler{bookingRepo: bookingRepo, propertyRepo: propertyRepo}
}

// Create godoc
// @Summary      Создать бронирование
// @Tags         bookings
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body model.CreateBookingRequest true "Данные бронирования"
// @Success      201 {object} model.Booking
// @Failure      400 {object} model.ErrorResponse
// @Failure      404 {object} model.ErrorResponse "Объявление не найдено"
// @Failure      409 {object} model.ErrorResponse "Даты пересекаются"
// @Failure      422 {object} model.ErrorResponse "Некорректные даты"
// @Router       /bookings [post]
func (h *BookingHandler) Create(c *gin.Context) {
	var req model.CreateBookingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{Code: 400, Message: "invalid request", Details: err.Error()})
		return
	}

	tenantID := middleware.GetUserID(c)

	// Date validating
	start, err1 := time.Parse("2006-01-02", req.StartDate)
	end, err2 := time.Parse("2006-01-02", req.EndDate)
	if err1 != nil || err2 != nil || !end.After(start) {
		c.JSON(http.StatusUnprocessableEntity, model.ErrorResponse{Code: 422, Message: "invalid dates: end_date must be after start_date"})
		return
	}

	// Checking the object
	property, err := h.propertyRepo.GetByID(req.PropertyID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, model.ErrorResponse{Code: 404, Message: "property not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: "internal error"})
		return
	}

	// Checking date overlap
	overlap, err := h.bookingRepo.HasOverlap(req.PropertyID, req.StartDate, req.EndDate, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: "internal error"})
		return
	}
	if overlap {
		c.JSON(http.StatusConflict, model.ErrorResponse{Code: 409, Message: "dates overlap with existing booking"})
		return
	}

	// Count sum total
	days := int(end.Sub(start).Hours() / 24)
	priceTotal := property.PricePerNight * float64(days)

	booking, err := h.bookingRepo.Create(tenantID, req, priceTotal)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: "failed to create booking", Details: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, booking)
}

// List godoc
// @Summary      Мои бронирования (арендатор)
// @Tags         bookings
// @Produce      json
// @Security     BearerAuth
// @Param        status query string  false "Фильтр по статусу"
// @Param        limit  query integer false "Лимит"  default(20)
// @Param        offset query integer false "Смещение" default(0)
// @Success      200 {object} model.PaginatedResponse
// @Failure      401 {object} model.ErrorResponse
// @Router       /bookings [get]
func (h *BookingHandler) List(c *gin.Context) {
	tenantID := middleware.GetUserID(c)
	var filter model.BookingFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{Code: 400, Message: "invalid query"})
		return
	}

	bookings, total, err := h.bookingRepo.ListByTenant(tenantID, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: "internal error"})
		return
	}

	c.JSON(http.StatusOK, model.PaginatedResponse{
		Items:      bookings,
		Pagination: model.Pagination{Limit: filter.Limit, Offset: filter.Offset, Total: total},
	})
}

// ListOwnerBookings godoc
// @Summary      Бронирования моих объявлений (владелец)
// @Tags         bookings
// @Produce      json
// @Security     BearerAuth
// @Param        status query string  false "Фильтр по статусу"
// @Param        limit  query integer false "Лимит"  default(20)
// @Param        offset query integer false "Смещение" default(0)
// @Success      200 {object} model.PaginatedResponse
// @Failure      401 {object} model.ErrorResponse
// @Router       /users/me/owner/bookings [get]
func (h *BookingHandler) ListOwnerBookings(c *gin.Context) {
	ownerID := middleware.GetUserID(c)
	var filter model.BookingFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{Code: 400, Message: "invalid query"})
		return
	}

	bookings, total, err := h.bookingRepo.ListByOwner(ownerID, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: "internal error"})
		return
	}

	c.JSON(http.StatusOK, model.PaginatedResponse{
		Items:      bookings,
		Pagination: model.Pagination{Limit: filter.Limit, Offset: filter.Offset, Total: total},
	})
}

// GetByID godoc
// @Summary      Получить бронирование по ID
// @Tags         bookings
// @Produce      json
// @Security     BearerAuth
// @Param        bookingId path string true "ID бронирования"
// @Success      200 {object} model.Booking
// @Failure      403 {object} model.ErrorResponse "Нет доступа"
// @Failure      404 {object} model.ErrorResponse
// @Router       /bookings/{bookingId} [get]
func (h *BookingHandler) GetByID(c *gin.Context) {
	id := c.Param("bookingId")
	userID := middleware.GetUserID(c)

	booking, err := h.bookingRepo.GetByID(id)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, model.ErrorResponse{Code: 404, Message: "booking not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: "internal error"})
		return
	}

	// Checking that user is a renter or owner of the property
	property, _ := h.propertyRepo.GetByID(booking.PropertyID)
	if booking.TenantID != userID && (property == nil || property.OwnerID != userID) {
		c.JSON(http.StatusForbidden, model.ErrorResponse{Code: 403, Message: "access denied"})
		return
	}

	c.JSON(http.StatusOK, booking)
}

// UpdateStatus godoc
// @Summary      Обновить статус бронирования
// @Description  approved/rejected/completed — только владелец; cancelled — арендатор или владелец
// @Tags         bookings
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        bookingId path string                          true "ID бронирования"
// @Param        body      body model.UpdateBookingStatusRequest true "Новый статус"
// @Success      200 {object} model.Booking
// @Failure      400 {object} model.ErrorResponse
// @Failure      403 {object} model.ErrorResponse
// @Failure      404 {object} model.ErrorResponse
// @Router       /bookings/{bookingId} [patch]
func (h *BookingHandler) UpdateStatus(c *gin.Context) {
	id := c.Param("bookingId")
	userID := middleware.GetUserID(c)

	var req model.UpdateBookingStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{Code: 400, Message: "invalid request", Details: err.Error()})
		return
	}

	booking, err := h.bookingRepo.GetByID(id)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, model.ErrorResponse{Code: 404, Message: "booking not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: "internal error"})
		return
	}

	property, _ := h.propertyRepo.GetByID(booking.PropertyID)

	// approve/reject — only owner, cancelled — renter or owner, completed — owner
	switch req.Status {
	case "approved", "rejected", "completed":
		if property == nil || property.OwnerID != userID {
			c.JSON(http.StatusForbidden, model.ErrorResponse{Code: 403, Message: "only the owner can perform this action"})
			return
		}
	case "cancelled":
		if booking.TenantID != userID && (property == nil || property.OwnerID != userID) {
			c.JSON(http.StatusForbidden, model.ErrorResponse{Code: 403, Message: "access denied"})
			return
		}
	}

	updated, err := h.bookingRepo.UpdateStatus(id, req.Status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: "failed to update status"})
		return
	}

	c.JSON(http.StatusOK, updated)
}
