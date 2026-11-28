package handlers

import (
	"context"
	"errors"
	"log"
	"net/http"
	"strconv"

	"rental-platform/services/rental-service/internal/models"
	"rental-platform/services/rental-service/internal/services"
	sharedmw "rental-platform/shared/middleware"

	"github.com/gin-gonic/gin"
)

type RentalHandler struct {
	Service *services.RentalService
}

func (h *RentalHandler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "rental-service"})
}

func (h *RentalHandler) ListRentals(c *gin.Context) {
	uid, ok := sharedmw.UserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	role := c.DefaultQuery("role", "all")
	status := c.Query("status")
	limit, offset := pagination(c)

	rentals, err := h.Service.List(uid, role, status, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to list rentals"})
		return
	}
	items := make([]gin.H, 0, len(rentals))
	for i := range rentals {
		items = append(items, toRentalJSON(&rentals[i]))
	}
	c.JSON(http.StatusOK, items)
}

func (h *RentalHandler) CreateRental(c *gin.Context) {
	uid, ok := sharedmw.UserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	var req struct {
		PropertyID uint   `json:"property_id" binding:"required"`
		StartDate  string `json:"start_date" binding:"required"`
		EndDate    string `json:"end_date" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	start, err := services.ParseDate(req.StartDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid start_date"})
		return
	}
	end, err := services.ParseDate(req.EndDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid end_date"})
		return
	}

	full, err := h.Service.Create(c.Request.Context(), services.CreateRentalInput{
		PropertyID: req.PropertyID,
		StartDate:  start,
		EndDate:    end,
		TenantID:   uid,
	})
	if err != nil {
		c.Error(err) // gin log
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": err.Error(),
		})
		log.Printf("create rental error: %+v", err)
		return
	}
	// if err != nil {
	// 	writeServiceError(c, err)
	// 	return
	// }
	c.JSON(http.StatusCreated, toRentalFullJSON(full))
}

func (h *RentalHandler) GetRental(c *gin.Context) {
	uid, ok := sharedmw.UserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	rentalID, err := parseID(c.Param("rental_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid rental id"})
		return
	}

	full, err := h.Service.Get(c.Request.Context(), rentalID, uid)
	if err != nil {
		writeServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, toRentalFullJSON(full))
}

func (h *RentalHandler) DeleteRental(c *gin.Context) {
	uid, ok := sharedmw.UserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	rentalID, err := parseID(c.Param("rental_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid rental id"})
		return
	}

	if err := h.Service.Cancel(c.Request.Context(), rentalID, uid); err != nil {
		writeServiceError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *RentalHandler) ApproveRental(c *gin.Context) {
	h.patchRentalAction(c, func(ctx context.Context, rentalID, uid uint) (any, error) {
		return h.Service.Approve(ctx, rentalID, uid)
	})
}

func (h *RentalHandler) RejectRental(c *gin.Context) {
	h.patchRentalAction(c, func(ctx context.Context, rentalID, uid uint) (any, error) {
		return h.Service.Reject(ctx, rentalID, uid)
	})
}

func (h *RentalHandler) CompleteRental(c *gin.Context) {
	h.patchRentalAction(c, func(ctx context.Context, rentalID, uid uint) (any, error) {
		return h.Service.Complete(ctx, rentalID, uid)
	})
}

func (h *RentalHandler) Dashboard(c *gin.Context) {
	uid, ok := sharedmw.UserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	asTenant, asLandlord, err := h.Service.Dashboard(uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to load dashboard"})
		return
	}

	tenantItems := make([]gin.H, 0, len(asTenant))
	for i := range asTenant {
		tenantItems = append(tenantItems, toRentalJSON(&asTenant[i]))
	}
	landlordItems := make([]gin.H, 0, len(asLandlord))
	for i := range asLandlord {
		landlordItems = append(landlordItems, toRentalJSON(&asLandlord[i]))
	}

	c.JSON(http.StatusOK, gin.H{
		"as_tenant":   tenantItems,
		"as_landlord": landlordItems,
	})
}

func (h *RentalHandler) GetPropertyActiveRental(c *gin.Context) {
	propertyID, err := parseID(c.Param("property_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid property id"})
		return
	}

	isRented, activeID, err := h.Service.PropertyActiveStatus(propertyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to check rental status"})
		return
	}

	resp := gin.H{
		"property_id": propertyID,
		"is_rented":   isRented,
	}
	if activeID != nil {
		resp["active_rental_id"] = *activeID
	} else {
		resp["active_rental_id"] = nil
	}
	c.JSON(http.StatusOK, resp)
}

func (h *RentalHandler) patchRentalAction(c *gin.Context, fn func(ctx context.Context, rentalID, uid uint) (any, error)) {
	uid, ok := sharedmw.UserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	rentalID, err := parseID(c.Param("rental_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid rental id"})
		return
	}

	result, err := fn(c.Request.Context(), rentalID, uid)
	if err != nil {
		writeServiceError(c, err)
		return
	}
	if full, ok := result.(*services.RentalFull); ok {
		c.JSON(http.StatusOK, toRentalFullJSON(full))
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "ok"})
}

func writeServiceError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, services.ErrNotFound), errors.Is(err, services.ErrPropertyMissing):
		c.JSON(http.StatusNotFound, gin.H{"message": err.Error()})
	case errors.Is(err, services.ErrForbidden):
		c.JSON(http.StatusForbidden, gin.H{"message": err.Error()})
	case errors.Is(err, services.ErrConflict), errors.Is(err, services.ErrPropertyRented):
		c.JSON(http.StatusConflict, gin.H{"message": err.Error()})
	case errors.Is(err, services.ErrBadRequest):
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"message": "internal error"})
	}
}

func toRentalJSON(r *models.Rental) gin.H {
	return gin.H{
		"id":          r.ID,
		"property_id": r.PropertyID,
		"tenant_id":   r.TenantID,
		"landlord_id": r.LandlordID,
		"start_date":  r.StartDate.Format("2006-01-02"),
		"end_date":    r.EndDate.Format("2006-01-02"),
		"total_price": r.TotalPrice,
		"status":      r.Status,
		"created_at":  r.CreatedAt,
	}
}

func toRentalFullJSON(full *services.RentalFull) gin.H {
	out := toRentalJSON(&full.Rental)
	if full.Property != nil {
		out["property"] = full.Property
	}
	return out
}

func parseID(s string) (uint, error) {
	v, err := strconv.ParseUint(s, 10, 64)
	return uint(v), err
}

func pagination(c *gin.Context) (int, int) {
	limit, offset := 20, 0
	if v := c.Query("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 && n <= 100 {
			limit = n
		}
	}
	if v := c.Query("offset"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n >= 0 {
			offset = n
		}
	}
	return limit, offset
}
