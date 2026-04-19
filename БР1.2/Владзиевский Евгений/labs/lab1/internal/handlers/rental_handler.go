package handlers

import (
	"net/http"
	"rental-api/internal/config"
	"rental-api/internal/models"
	"rental-api/internal/repositories"
	"rental-api/internal/services"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type RentalHandler struct {
	rentalService services.RentalService
	cfg           *config.Config
	validate      *validator.Validate
}

func NewRentalHandler(cfg *config.Config) *RentalHandler {
	rentalRepo := repositories.NewRentalRepository()
	propertyRepo := repositories.NewPropertyRepository()
	userRepo := repositories.NewUserRepository()
	transactionRepo := repositories.NewTransactionRepository()
	rentalService := services.NewRentalService(rentalRepo, propertyRepo, userRepo, transactionRepo)
	return &RentalHandler{
		rentalService: rentalService,
		cfg:           cfg,
		validate:      validator.New(),
	}
}

// RentalCreateRequest matches OpenAPI schema for POST /rentals
type RentalCreateRequest struct {
	PropertyID uint      `json:"property_id" binding:"required"`
	StartDate  time.Time `json:"start_date" binding:"required"`
	EndDate    time.Time `json:"end_date" binding:"required"`
}

// RentalUpdateStatusRequest matches OpenAPI schema for PATCH /rentals/{id}
type RentalUpdateStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=confirmed cancelled finished"`
}

// RentalPayRequest matches OpenAPI schema for POST /rentals/{id}/pay
type RentalPayRequest struct {
	PaymentMethod  string  `json:"payment_method" binding:"required"`
	IdempotencyKey *string `json:"idempotency_key,omitempty"`
}

// RentalPropertyResponse is the nested property object in RentalResponse
type RentalPropertyResponse struct {
	ID          uint    `json:"id"`
	Title       string  `json:"title"`
	City        string  `json:"city"`
	PricePerDay float64 `json:"price_per_day"`
}

// RentalResponse matches OpenAPI schema RentalResponse
type RentalResponse struct {
	ID         uint                   `json:"id"`
	Property   RentalPropertyResponse `json:"property"`
	Tenant     UserResponse           `json:"tenant"`
	Owner      UserResponse           `json:"owner"`
	StartDate  string                 `json:"start_date"` // ISO date (YYYY-MM-DD)
	EndDate    string                 `json:"end_date"`   // ISO date (YYYY-MM-DD)
	TotalPrice float64                `json:"total_price"`
	Status     string                 `json:"status"`
	CreatedAt  string                 `json:"created_at"` // ISO datetime
}

// TransactionResponse matches OpenAPI schema TransactionResponse
type TransactionResponse struct {
	ID            uint    `json:"id"`
	RentalID      uint    `json:"rental_id"`
	Amount        float64 `json:"amount"`
	PaymentMethod string  `json:"payment_method"`
	Status        string  `json:"status"`
	CreatedAt     string  `json:"created_at"`
}

// RentalListResponse matches OpenAPI schema for GET /rentals response
type RentalListResponse struct {
	Total int64            `json:"total"`
	Items []RentalResponse `json:"items"`
}

func rentalToResponse(rental *models.Rental) RentalResponse {
	var owner UserResponse
	if rental.Property.Owner.ID != 0 {
		owner = userToResponse(&rental.Property.Owner)
	}
	var tenant UserResponse
	if rental.Tenant.ID != 0 {
		tenant = userToResponse(&rental.Tenant)
	}
	property := RentalPropertyResponse{
		ID:          rental.Property.ID,
		Title:       rental.Property.Title,
		City:        rental.Property.City,
		PricePerDay: rental.Property.PricePerDay,
	}
	return RentalResponse{
		ID:         rental.ID,
		Property:   property,
		Tenant:     tenant,
		Owner:      owner,
		StartDate:  rental.StartDate.Format("2006-01-02"),
		EndDate:    rental.EndDate.Format("2006-01-02"),
		TotalPrice: rental.TotalPrice,
		Status:     rental.Status,
		CreatedAt:  rental.CreatedAt.Format(time.RFC3339),
	}
}

func transactionToResponse(transaction *models.Transaction) TransactionResponse {
	var paymentMethod string
	if transaction.PaymentMethod != nil {
		paymentMethod = *transaction.PaymentMethod
	}
	return TransactionResponse{
		ID:            transaction.ID,
		RentalID:      transaction.RentalID,
		Amount:        transaction.Amount,
		PaymentMethod: paymentMethod,
		Status:        transaction.Status,
		CreatedAt:     transaction.CreatedAt.Format(time.RFC3339),
	}
}

// Helper to get user info from context (copied from other handlers)
func getUserInfo(c *gin.Context) (userID uint, userRole string, ok bool) {
	uid, exists := c.Get("user_id")
	if !exists {
		return 0, "", false
	}
	role, exists := c.Get("user_role")
	if !exists {
		return 0, "", false
	}
	// Type assertions
	var uidUint uint
	switch v := uid.(type) {
	case uint:
		uidUint = v
	case float64:
		uidUint = uint(v)
	default:
		return 0, "", false
	}
	roleStr, ok := role.(string)
	if !ok {
		return 0, "", false
	}
	return uidUint, roleStr, true
}

// List returns paginated rentals for the current user (tenant, owner, or admin)
func (h *RentalHandler) List(c *gin.Context) {
	userID, userRole, ok := getUserInfo(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Authentication required",
			},
		})
		return
	}

	var filters services.RentalFilters
	if err := c.ShouldBindQuery(&filters); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid query parameters",
				"details": err.Error(),
			},
		})
		return
	}

	// Set defaults
	if filters.Limit == 0 {
		filters.Limit = 20
	}
	if filters.Limit > 100 {
		filters.Limit = 100
	}

	rentals, total, err := h.rentalService.List(filters, userID, userRole)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to retrieve rentals",
				"details": err.Error(),
			},
		})
		return
	}

	// Map to response
	items := make([]RentalResponse, len(rentals))
	for i, r := range rentals {
		items[i] = rentalToResponse(&r)
	}

	c.JSON(http.StatusOK, RentalListResponse{
		Total: total,
		Items: items,
	})
}

// Create a new rental (tenant only)
func (h *RentalHandler) Create(c *gin.Context) {
	userID, userRole, ok := getUserInfo(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Authentication required",
			},
		})
		return
	}
	if userRole != "tenant" {
		c.JSON(http.StatusForbidden, gin.H{
			"error": gin.H{
				"code":    "FORBIDDEN",
				"message": "Only tenants can create bookings",
			},
		})
		return
	}

	var req RentalCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid request format",
				"details": err.Error(),
			},
		})
		return
	}

	// Validate using validator
	if err := h.validate.Struct(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Validation failed",
				"details": err.Error(),
			},
		})
		return
	}

	input := services.RentalInput{
		PropertyID: req.PropertyID,
		StartDate:  req.StartDate,
		EndDate:    req.EndDate,
	}

	rental, err := h.rentalService.Create(input, userID)
	if err != nil {
		status := http.StatusBadRequest
		switch err.Error() {
		case "property not found":
			status = http.StatusNotFound
		case "property is not available for booking":
			status = http.StatusBadRequest
		case "cannot book your own property":
			status = http.StatusForbidden
		case "property already booked for the selected dates":
			status = http.StatusConflict
		case "start date must be in the future", "end date must be after start date":
			status = http.StatusBadRequest
		}
		c.JSON(status, gin.H{
			"error": gin.H{
				"code":    "CREATE_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusCreated, rentalToResponse(rental))
}

// Get rental details
func (h *RentalHandler) Get(c *gin.Context) {
	userID, userRole, ok := getUserInfo(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Authentication required",
			},
		})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid rental ID",
			},
		})
		return
	}

	rental, err := h.rentalService.GetByID(uint(id), userID, userRole)
	if err != nil {
		status := http.StatusBadRequest
		if err.Error() == "rental not found" {
			status = http.StatusNotFound
		} else if err.Error() == "forbidden" {
			status = http.StatusForbidden
		}
		c.JSON(status, gin.H{
			"error": gin.H{
				"code":    "GET_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, rentalToResponse(rental))
}

// UpdateStatus changes rental status (tenant can cancel, owner can confirm/cancel, admin can do any)
func (h *RentalHandler) UpdateStatus(c *gin.Context) {
	userID, userRole, ok := getUserInfo(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Authentication required",
			},
		})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid rental ID",
			},
		})
		return
	}

	var req RentalUpdateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid request format",
				"details": err.Error(),
			},
		})
		return
	}

	if err := h.validate.Struct(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Validation failed",
				"details": err.Error(),
			},
		})
		return
	}

	rental, err := h.rentalService.UpdateStatus(uint(id), req.Status, userID, userRole)
	if err != nil {
		status := http.StatusBadRequest
		switch err.Error() {
		case "rental not found":
			status = http.StatusNotFound
		case "forbidden":
			status = http.StatusForbidden
		case "tenant can only cancel bookings", "owner can only confirm or cancel bookings":
			status = http.StatusForbidden
		case "invalid status transition":
			status = http.StatusUnprocessableEntity
		case "invalid current status":
			status = http.StatusBadRequest
		}
		c.JSON(status, gin.H{
			"error": gin.H{
				"code":    "UPDATE_STATUS_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, rentalToResponse(rental))
}

// Pay processes payment for a confirmed rental (tenant only)
func (h *RentalHandler) Pay(c *gin.Context) {
	userID, userRole, ok := getUserInfo(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Authentication required",
			},
		})
		return
	}
	if userRole != "tenant" {
		c.JSON(http.StatusForbidden, gin.H{
			"error": gin.H{
				"code":    "FORBIDDEN",
				"message": "Only tenants can pay for bookings",
			},
		})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid rental ID",
			},
		})
		return
	}

	var req RentalPayRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid request format",
				"details": err.Error(),
			},
		})
		return
	}

	if err := h.validate.Struct(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Validation failed",
				"details": err.Error(),
			},
		})
		return
	}

	rental, transaction, err := h.rentalService.Pay(uint(id), req.PaymentMethod, userID)
	if err != nil {
		status := http.StatusBadRequest
		switch err.Error() {
		case "rental not found":
			status = http.StatusNotFound
		case "forbidden":
			status = http.StatusForbidden
		case "rental must be confirmed before payment":
			status = http.StatusBadRequest
		}
		c.JSON(status, gin.H{
			"error": gin.H{
				"code":    "PAY_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"rental":      rentalToResponse(rental),
		"transaction": transactionToResponse(transaction),
	})
}
