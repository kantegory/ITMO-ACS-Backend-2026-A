package handler

import (
	"database/sql"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/ZZISST/rental-booking-service/internal/client"
	"github.com/ZZISST/rental-booking-service/internal/messaging"
	"github.com/ZZISST/rental-booking-service/internal/middleware"
	"github.com/ZZISST/rental-booking-service/internal/model"
	"github.com/ZZISST/rental-booking-service/internal/repository"
)

type BookingHandler struct {
	bookingRepo    *repository.BookingRepository
	propertyClient *client.PropertyClient
	publisher      *messaging.Publisher
}

func NewBookingHandler(bookingRepo *repository.BookingRepository, propertyClient *client.PropertyClient, publisher *messaging.Publisher) *BookingHandler {
	return &BookingHandler{bookingRepo: bookingRepo, propertyClient: propertyClient, publisher: publisher}
}

func (h *BookingHandler) publishEvent(eventType string, booking *model.Booking) {
	if h.publisher == nil {
		return
	}
	err := h.publisher.PublishBookingEvent(messaging.BookingEvent{
		EventType:  eventType,
		BookingID:  booking.ID,
		PropertyID: booking.PropertyID,
		TenantID:   booking.TenantID,
		Status:     booking.Status,
		PriceTotal: booking.PriceTotal,
	})
	if err != nil {
		log.Printf("failed to publish event: %v", err)
	}
}

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

	start, err1 := time.Parse("2006-01-02", req.StartDate)
	end, err2 := time.Parse("2006-01-02", req.EndDate)
	if err1 != nil || err2 != nil || !end.After(start) {
		c.JSON(http.StatusUnprocessableEntity, model.ErrorResponse{Code: 422, Message: "invalid dates: end_date must be after start_date"})
		return
	}

	property, err := h.propertyClient.GetByID(req.PropertyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: "failed to check property"})
		return
	}
	if property == nil {
		c.JSON(http.StatusNotFound, model.ErrorResponse{Code: 404, Message: "property not found"})
		return
	}

	overlap, err := h.bookingRepo.HasOverlap(req.PropertyID, req.StartDate, req.EndDate, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: "internal error"})
		return
	}
	if overlap {
		c.JSON(http.StatusConflict, model.ErrorResponse{Code: 409, Message: "dates overlap with existing booking"})
		return
	}

	days := int(end.Sub(start).Hours() / 24)
	priceTotal := property.PricePerNight * float64(days)

	booking, err := h.bookingRepo.Create(tenantID, req, priceTotal)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: "failed to create booking", Details: err.Error()})
		return
	}

	h.publishEvent("booking.created", booking)

	c.JSON(http.StatusCreated, booking)
}

// @Summary      Мои бронирования (арендатор)
// @Tags         bookings
// @Produce      json
// @Security     BearerAuth
// @Param        status query string false "Фильтр по статусу"
// @Param        limit query integer false "Лимит" default(20)
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

// @Summary      Бронирования моих объявлений (владелец)
// @Tags         bookings
// @Produce      json
// @Security     BearerAuth
// @Param        status query string false "Фильтр по статусу"
// @Param        limit query integer false "Лимит" default(20)
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

	propertyIDs, err := h.propertyClient.ListIDsByOwner(ownerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: "failed to fetch owner properties"})
		return
	}

	bookings, total, err := h.bookingRepo.ListByPropertyIDs(propertyIDs, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: "internal error"})
		return
	}

	c.JSON(http.StatusOK, model.PaginatedResponse{
		Items:      bookings,
		Pagination: model.Pagination{Limit: filter.Limit, Offset: filter.Offset, Total: total},
	})
}

// @Summary      Получить бронирование по ID
// @Tags         bookings
// @Produce      json
// @Security     BearerAuth
// @Param        bookingId path string true "ID бронирования"
// @Success      200 {object} model.Booking
// @Failure      401 {object} model.ErrorResponse
// @Failure      403 {object} model.ErrorResponse
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

	property, _ := h.propertyClient.GetByID(booking.PropertyID)
	if booking.TenantID != userID && (property == nil || property.OwnerID != userID) {
		c.JSON(http.StatusForbidden, model.ErrorResponse{Code: 403, Message: "access denied"})
		return
	}

	c.JSON(http.StatusOK, booking)
}

// @Summary      Обновить статус бронирования
// @Tags         bookings
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        bookingId path string true "ID бронирования"
// @Param        body body model.UpdateBookingStatusRequest true "Новый статус"
// @Success      200 {object} model.Booking
// @Failure      400 {object} model.ErrorResponse
// @Failure      401 {object} model.ErrorResponse
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

	property, _ := h.propertyClient.GetByID(booking.PropertyID)

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

	h.publishEvent("booking.status_changed", updated)

	c.JSON(http.StatusOK, updated)
}
