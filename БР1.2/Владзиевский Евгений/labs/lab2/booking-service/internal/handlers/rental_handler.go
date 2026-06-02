package handlers

import (
	"booking-service/internal/client"
	"booking-service/internal/models"
	"booking-service/internal/services"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type RentalHandler struct {
	rentalService  *services.RentalService
	authClient     *client.AuthClient
	propertyClient *client.PropertyClient
}

func NewRentalHandler(rentalService *services.RentalService, authClient *client.AuthClient, propertyClient *client.PropertyClient) *RentalHandler {
	return &RentalHandler{
		rentalService:  rentalService,
		authClient:     authClient,
		propertyClient: propertyClient,
	}
}

func (h *RentalHandler) List(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	var tenantID, ownerID, propertyID *uint
	var status *string

	if v := c.Query("tenant_id"); v != "" {
		id, err := strconv.ParseUint(v, 10, 32)
		if err == nil {
			uid := uint(id)
			tenantID = &uid
		}
	}

	if v := c.Query("owner_id"); v != "" {
		id, err := strconv.ParseUint(v, 10, 32)
		if err == nil {
			uid := uint(id)
			ownerID = &uid
		}
	}

	if v := c.Query("property_id"); v != "" {
		id, err := strconv.ParseUint(v, 10, 32)
		if err == nil {
			uid := uint(id)
			propertyID = &uid
		}
	}

	if v := c.Query("status"); v != "" {
		status = &v
	}

	uid := userID.(uint)
	role := userRole.(string)

	if role != "admin" {
		if role == "tenant" && tenantID == nil {
			tenantID = &uid
		} else if role == "tenant" && *tenantID != uid {
			c.JSON(http.StatusForbidden, gin.H{"error": gin.H{"code": "FORBIDDEN", "message": "Tenants can only view their own rentals"}})
			return
		}
		if role == "owner" && ownerID == nil {
			ownerID = &uid
		} else if role == "owner" && *ownerID != uid {
			c.JSON(http.StatusForbidden, gin.H{"error": gin.H{"code": "FORBIDDEN", "message": "Owners can only view their own property rentals"}})
			return
		}
	}

	rentals, err := h.rentalService.List(tenantID, ownerID, propertyID, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "INTERNAL_ERROR", "message": "Failed to fetch rentals"}})
		return
	}

	items := make([]gin.H, len(rentals))
	for i, r := range rentals {
		item := buildRentalResponse(&r)
		if user, err := h.authClient.GetUserBrief(r.TenantID); err == nil && user != nil {
			item["tenant"] = user
		}
		if user, err := h.authClient.GetUserBrief(r.OwnerID); err == nil && user != nil {
			item["owner"] = user
		}
		if prop, err := h.propertyClient.GetPropertyBrief(r.PropertyID); err == nil && prop != nil {
			item["property"] = prop
		}
		items[i] = item
	}

	c.JSON(http.StatusOK, gin.H{
		"total": len(rentals),
		"items": items,
	})
}

func (h *RentalHandler) Create(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var input services.CreateRentalInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "VALIDATION_ERROR", "message": err.Error()}})
		return
	}

	rental, err := h.rentalService.Create(userID.(uint), input)
	if err != nil {
		status := http.StatusBadRequest
		if err.Error() == "property not found" || err.Error() == "property is not available for booking" {
			status = http.StatusNotFound
		} else if err.Error() == "property is already booked for the selected dates" {
			status = http.StatusConflict
		}
		c.JSON(status, gin.H{"error": gin.H{"code": "CREATE_ERROR", "message": err.Error()}})
		return
	}

	rentalResp := buildRentalResponse(rental)
	tenantResp, _ := h.authClient.GetUserBrief(rental.TenantID)
	ownerResp, _ := h.authClient.GetUserBrief(rental.OwnerID)
	propResp, _ := h.propertyClient.GetPropertyBrief(rental.PropertyID)
	if tenantResp != nil {
		rentalResp["tenant"] = tenantResp
	} else {
		rentalResp["tenant"] = gin.H{"id": rental.TenantID}
	}
	if ownerResp != nil {
		rentalResp["owner"] = ownerResp
	} else {
		rentalResp["owner"] = gin.H{"id": rental.OwnerID}
	}
	if propResp != nil {
		rentalResp["property"] = propResp
	} else {
		rentalResp["property"] = gin.H{"id": rental.PropertyID, "title": ""}
	}
	c.JSON(http.StatusCreated, rentalResp)
}

func (h *RentalHandler) Get(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "INVALID_REQUEST", "message": "Invalid rental ID"}})
		return
	}

	rental, err := h.rentalService.GetByID(uint(id), userID.(uint), userRole.(string))
	if err != nil {
		status := http.StatusNotFound
		if err.Error() == "access denied" {
			status = http.StatusForbidden
		}
		c.JSON(status, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": err.Error()}})
		return
	}

	c.JSON(http.StatusOK, buildRentalResponse(rental))
}

func (h *RentalHandler) UpdateStatus(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "INVALID_REQUEST", "message": "Invalid rental ID"}})
		return
	}

	var input services.UpdateStatusInput
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

	rental, err := h.rentalService.UpdateStatus(uint(id), userID.(uint), userRole.(string), input.Status)
	if err != nil {
		status := http.StatusBadRequest
		if err.Error() == "rental not found" {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": gin.H{"code": "STATUS_ERROR", "message": err.Error()}})
		return
	}

	c.JSON(http.StatusOK, buildRentalResponse(rental))
}

func (h *RentalHandler) Pay(c *gin.Context) {
	userID, _ := c.Get("user_id")

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "INVALID_REQUEST", "message": "Invalid rental ID"}})
		return
	}

	var input struct {
		PaymentMethod  string `json:"payment_method" binding:"required"`
		IdempotencyKey string `json:"idempotency_key" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "VALIDATION_ERROR", "message": err.Error()}})
		return
	}

	result, err := h.rentalService.SagaPayOrchestrate(uint(id), userID.(uint), input.PaymentMethod, input.IdempotencyKey)
	if err != nil {
		status := http.StatusBadRequest
		if err.Error() == "rental not found" {
			status = http.StatusNotFound
		} else if err.Error() == "only the tenant can pay for a rental" {
			status = http.StatusForbidden
		}
		c.JSON(status, gin.H{"error": gin.H{"code": "PAYMENT_ERROR", "message": err.Error()}})
		return
	}

	rentalResp := buildRentalResponse(result.Rental)
	if user, err := h.authClient.GetUserBrief(result.Rental.TenantID); err == nil && user != nil {
		rentalResp["tenant"] = user
	}
	if user, err := h.authClient.GetUserBrief(result.Rental.OwnerID); err == nil && user != nil {
		rentalResp["owner"] = user
	}
	if prop, err := h.propertyClient.GetPropertyBrief(result.Rental.PropertyID); err == nil && prop != nil {
		rentalResp["property"] = prop
	}
	c.JSON(http.StatusOK, gin.H{
		"rental":      rentalResp,
		"transaction": result.Transaction,
	})
}

func buildRentalResponse(rental *models.Rental) gin.H {
	return gin.H{
		"id":          rental.ID,
		"tenant_id":   rental.TenantID,
		"property_id": rental.PropertyID,
		"owner_id":    rental.OwnerID,
		"start_date":  rental.StartDate.Format("2006-01-02"),
		"end_date":    rental.EndDate.Format("2006-01-02"),
		"total_price": rental.TotalPrice,
		"status":      rental.Status,
		"created_at":  rental.CreatedAt.Format(time.RFC3339),
	}
}