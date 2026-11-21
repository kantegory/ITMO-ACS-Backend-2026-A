package handlers

import (
	"booking-service/internal/repositories"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type InternalHandler struct {
	rentalRepo *repositories.RentalRepository
}

func NewInternalHandler(rentalRepo *repositories.RentalRepository) *InternalHandler {
	return &InternalHandler{rentalRepo: rentalRepo}
}

func (h *InternalHandler) CheckRental(c *gin.Context) {
	propertyIDStr := c.Query("property_id")
	user1IDStr := c.Query("user1_id")
	user2IDStr := c.Query("user2_id")

	propertyID, err := strconv.ParseUint(propertyIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "INVALID_REQUEST", "message": "Invalid property_id"}})
		return
	}

	user1ID, err1 := strconv.ParseUint(user1IDStr, 10, 32)
	user2ID, err2 := strconv.ParseUint(user2IDStr, 10, 32)
	if err1 != nil && err2 != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "INVALID_REQUEST", "message": "At least one of user1_id or user2_id is required"}})
		return
	}

	var rentalID *uint
	var rentalStatus string

	if err1 == nil && err2 == nil {
		userA := uint(user1ID)
		userB := uint(user2ID)

		rentals, err := h.rentalRepo.FindAllWithFilters(&userA, &userB, uintPtr(uint(propertyID)), nil)
		if err != nil {
			c.JSON(http.StatusOK, gin.H{"has_rental": false})
			return
		}

		for _, r := range rentals {
			if r.Status == "confirmed" || r.Status == "paid" || r.Status == "payment_pending" {
				rentalID = &r.ID
				rentalStatus = r.Status
				break
			}
		}

		if rentalID == nil {
			rentals2, err := h.rentalRepo.FindAllWithFilters(&userB, &userA, uintPtr(uint(propertyID)), nil)
			if err == nil {
				for _, r := range rentals2 {
					if r.Status == "confirmed" || r.Status == "paid" || r.Status == "payment_pending" {
						rentalID = &r.ID
						rentalStatus = r.Status
						break
					}
				}
			}
		}
	} else if err1 == nil {
		userID := uint(user1ID)
		rentals, err := h.rentalRepo.FindAllWithFilters(&userID, nil, uintPtr(uint(propertyID)), nil)
		if err != nil {
			c.JSON(http.StatusOK, gin.H{"has_rental": false})
			return
		}

		for _, r := range rentals {
			if r.Status == "confirmed" || r.Status == "paid" || r.Status == "payment_pending" {
				rentalID = &r.ID
				rentalStatus = r.Status
				break
			}
		}
	} else {
		userID := uint(user2ID)
		rentals, err := h.rentalRepo.FindAllWithFilters(nil, &userID, uintPtr(uint(propertyID)), nil)
		if err != nil {
			c.JSON(http.StatusOK, gin.H{"has_rental": false})
			return
		}

		for _, r := range rentals {
			if r.Status == "confirmed" || r.Status == "paid" || r.Status == "payment_pending" {
				rentalID = &r.ID
				rentalStatus = r.Status
				break
			}
		}
	}

	if rentalID != nil {
		c.JSON(http.StatusOK, gin.H{
			"has_rental": true,
			"rental_id":  *rentalID,
			"status":     rentalStatus,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"has_rental": false})
}

func (h *InternalHandler) GetRentalByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "INVALID_REQUEST", "message": "Invalid rental ID"}})
		return
	}

	rental, err := h.rentalRepo.FindByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": "Rental not found"}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"rental": rental})
}

func (h *InternalHandler) UpdateRentalStatus(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "INVALID_REQUEST", "message": "Invalid rental ID"}})
		return
	}

	var input struct {
		Status         string `json:"status" binding:"required"`
		IdempotencyKey string `json:"idempotency_key"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "VALIDATION_ERROR", "message": err.Error()}})
		return
	}

	validStatuses := map[string]bool{
		"pending": true, "confirmed": true, "paid": true,
		"payment_pending": true, "cancelled": true, "finished": true,
	}
	if !validStatuses[input.Status] {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "VALIDATION_ERROR", "message": "Invalid status value"}})
		return
	}

	rental, err := h.rentalRepo.FindByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": "Rental not found"}})
		return
	}

	if err := h.rentalRepo.UpdateStatus(rental.ID, input.Status); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "UPDATE_ERROR", "message": "Failed to update rental status"}})
		return
	}

	rental, _ = h.rentalRepo.FindByID(uint(id))
	c.JSON(http.StatusOK, gin.H{"rental": rental})
}

func uintPtr(v uint) *uint {
	return &v
}