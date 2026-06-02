package handlers

import (
	"encoding/json"
	"net/http"
	"payment-service/internal/config"
	ekafka "payment-service/internal/kafka"
	"payment-service/internal/models"
	"payment-service/internal/repositories"
	"payment-service/internal/services"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type InternalHandler struct {
	transactionService *services.TransactionService
	transactionRepo    *repositories.TransactionRepository
	outboxRepo         *repositories.OutboxRepository
	cfg                *config.Config
}

func NewInternalHandler(cfg *config.Config, outboxRepo *repositories.OutboxRepository) *InternalHandler {
	transactionRepo := repositories.NewTransactionRepository()
	transactionService := services.NewTransactionService(transactionRepo)
	return &InternalHandler{
		transactionService: transactionService,
		transactionRepo:    transactionRepo,
		outboxRepo:         outboxRepo,
		cfg:                cfg,
	}
}

type CreatePaymentRequest struct {
	RentalID       int     `json:"rental_id" binding:"required"`
	TenantID       int     `json:"tenant_id" binding:"required"`
	Amount         float64 `json:"amount" binding:"required"`
	PaymentMethod  string  `json:"payment_method" binding:"required"`
	IdempotencyKey string  `json:"idempotency_key"`
}

type CreateRefundRequest struct {
	TransactionID int `json:"transaction_id" binding:"required"`
}

func (h *InternalHandler) CreatePayment(c *gin.Context) {
	var req CreatePaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "VALIDATION_ERROR", "message": err.Error()}})
		return
	}

	input := services.CreatePaymentInput{
		RentalID:       req.RentalID,
		TenantID:       req.TenantID,
		Amount:         req.Amount,
		PaymentMethod:  req.PaymentMethod,
		IdempotencyKey: req.IdempotencyKey,
	}

	transaction, err := h.transactionService.CreatePayment(input)
	if err != nil {
		if err.Error() == "idempotency_key already exists" {
			c.JSON(http.StatusConflict, gin.H{
				"error": gin.H{"code": "IDEMPOTENCY_CONFLICT", "message": "Transaction with this idempotency key already exists"},
				"transaction": transactionToResponse(transaction),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "INTERNAL_ERROR", "message": "Failed to create payment"}})
		return
	}

	publishPaymentEvent(h.outboxRepo, uint(transaction.RentalID), uint(transaction.ID), "payment.completed", map[string]interface{}{
		"rental_id":       transaction.RentalID,
		"transaction_id":  transaction.ID,
		"tenant_id":       transaction.TenantID,
		"amount":          transaction.Amount,
		"payment_method":  transaction.PaymentMethod,
		"status":          transaction.Status,
	})

	c.JSON(http.StatusCreated, transactionToResponse(transaction))
}

func (h *InternalHandler) CreateRefund(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "INVALID_REQUEST", "message": "Invalid transaction ID"}})
		return
	}

	original, err := h.transactionRepo.FindByID(uint(id))
	if err != nil || original.ID == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": "Original transaction not found"}})
		return
	}

	if original.Type != "payment" {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "BAD_REQUEST", "message": "Can only refund payment transactions"}})
		return
	}

	if original.Status == "refunded" {
		c.JSON(http.StatusConflict, gin.H{"error": gin.H{"code": "ALREADY_REFUNDED", "message": "Transaction already refunded"}})
		return
	}

	input := services.CreateRefundInput{
		TransactionID: int(original.ID),
		RentalID:      original.RentalID,
		TenantID:      original.TenantID,
	}

	refund, err := h.transactionService.CreateRefund(input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "INTERNAL_ERROR", "message": err.Error()}})
		return
	}

	publishPaymentEvent(h.outboxRepo, uint(refund.RentalID), uint(refund.ID), "payment.refunded", map[string]interface{}{
		"rental_id":       refund.RentalID,
		"transaction_id":  refund.ID,
		"amount":          refund.Amount,
	})

	c.JSON(http.StatusCreated, transactionToResponse(refund))
}

func (h *InternalHandler) GetTransactionsByRental(c *gin.Context) {
	rentalIDStr := c.Param("rentalId")
	rentalID, err := strconv.Atoi(rentalIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "INVALID_REQUEST", "message": "Invalid rental ID"}})
		return
	}

	transactions, err := h.transactionService.GetByRentalID(rentalID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "INTERNAL_ERROR", "message": "Failed to retrieve transactions"}})
		return
	}

	items := make([]TransactionResponse, len(transactions))
	for i, tx := range transactions {
		items[i] = transactionToResponse(&tx)
	}

	c.JSON(http.StatusOK, items)
}

func publishPaymentEvent(outboxRepo *repositories.OutboxRepository, rentalID uint, transactionID uint, eventType string, data interface{}) {
	dto := ekafka.OutboxEventDTO{
		EventID:       uuid.New().String(),
		EventType:     eventType,
		AggregateType: "payment",
		AggregateID:   transactionID,
		Timestamp:     time.Now().UTC().Format(time.RFC3339),
		Data:          data,
		Source:        "payment-service",
	}

	payload, _ := json.Marshal(dto)
	event := &models.OutboxEvent{
		AggregateType: "payment",
		AggregateID:   transactionID,
		EventType:     eventType,
		Payload:       string(payload),
		Status:        "pending",
	}

	_ = outboxRepo.Create(nil, event)
}
