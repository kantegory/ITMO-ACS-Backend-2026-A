package handler

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/ZZISST/rental-api/internal/middleware"
	"github.com/ZZISST/rental-api/internal/model"
	"github.com/ZZISST/rental-api/internal/repository"
)

type ReviewHandler struct {
	reviewRepo  *repository.ReviewRepository
	bookingRepo *repository.BookingRepository
}

func NewReviewHandler(reviewRepo *repository.ReviewRepository, bookingRepo *repository.BookingRepository) *ReviewHandler {
	return &ReviewHandler{reviewRepo: reviewRepo, bookingRepo: bookingRepo}
}

// Create godoc
// @Summary      Оставить отзыв
// @Description  Только арендатор, у которого статус бронирования completed
// @Tags         reviews
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body model.CreateReviewRequest true "Данные отзыва"
// @Success      201 {object} model.Review
// @Failure      400 {object} model.ErrorResponse
// @Failure      403 {object} model.ErrorResponse "Не арендатор этого бронирования"
// @Failure      404 {object} model.ErrorResponse "Бронирование не найдено"
// @Failure      409 {object} model.ErrorResponse "Отзыв уже существует или бронирование не завершено"
// @Router       /reviews [post]
func (h *ReviewHandler) Create(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req model.CreateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{Code: 400, Message: "invalid request", Details: err.Error()})
		return
	}

	// Checking that the reservation exists and belongs to the user
	booking, err := h.bookingRepo.GetByID(req.BookingID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, model.ErrorResponse{Code: 404, Message: "booking not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: "internal error"})
		return
	}

	if booking.TenantID != userID {
		c.JSON(http.StatusForbidden, model.ErrorResponse{Code: 403, Message: "you can only review your own bookings"})
		return
	}

	// Only closed deals
	if booking.Status != "completed" {
		c.JSON(http.StatusConflict, model.ErrorResponse{Code: 409, Message: "booking must be completed before review"})
		return
	}

	// Checking duplicate
	exists, err := h.reviewRepo.ExistsByBooking(req.BookingID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: "internal error"})
		return
	}
	if exists {
		c.JSON(http.StatusConflict, model.ErrorResponse{Code: 409, Message: "review already exists for this booking"})
		return
	}

	review, err := h.reviewRepo.Create(userID, req, booking.PropertyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: "failed to create review", Details: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, review)
}
