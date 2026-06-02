package handlers

import (
	"net/http"
	"payment-service/internal/config"
	"payment-service/internal/models"
	"payment-service/internal/repositories"
	"payment-service/internal/services"
	"time"

	"github.com/gin-gonic/gin"
)

type TransactionHandler struct {
	transactionService *services.TransactionService
	cfg                *config.Config
	outboxRepo         *repositories.OutboxRepository
}

func NewTransactionHandler(cfg *config.Config, outboxRepo *repositories.OutboxRepository) *TransactionHandler {
	transactionRepo := repositories.NewTransactionRepository()
	transactionService := services.NewTransactionService(transactionRepo)
	return &TransactionHandler{
		transactionService: transactionService,
		cfg:                cfg,
		outboxRepo:         outboxRepo,
	}
}

type TransactionResponse struct {
	ID             uint    `json:"id"`
	RentalID       int     `json:"rental_id"`
	TenantID       int     `json:"tenant_id"`
	Amount         float64 `json:"amount"`
	PaymentMethod  string  `json:"payment_method"`
	IdempotencyKey string  `json:"idempotency_key,omitempty"`
	Type           string  `json:"type"`
	Status         string  `json:"status"`
	CreatedAt      string  `json:"created_at"`
}

func transactionToResponse(t *models.Transaction) TransactionResponse {
	return TransactionResponse{
		ID:             t.ID,
		RentalID:       t.RentalID,
		TenantID:       t.TenantID,
		Amount:         t.Amount,
		PaymentMethod:  t.PaymentMethod,
		IdempotencyKey: t.IdempotencyKey,
		Type:           t.Type,
		Status:         t.Status,
		CreatedAt:      t.CreatedAt.Format(time.RFC3339),
	}
}

func (h *TransactionHandler) List(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"code": "UNAUTHORIZED", "message": "Authentication required"}})
		return
	}

	var uid uint
	switch v := userID.(type) {
	case uint:
		uid = v
	case float64:
		uid = uint(v)
	default:
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"code": "UNAUTHORIZED", "message": "Invalid user ID"}})
		return
	}

	transactions, err := h.transactionService.List(int(uid))
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