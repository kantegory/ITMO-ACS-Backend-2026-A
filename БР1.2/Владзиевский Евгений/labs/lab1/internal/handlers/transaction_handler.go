package handlers

import (
	"net/http"
	"rental-api/internal/config"
	"rental-api/internal/repositories"
	"rental-api/internal/services"

	"github.com/gin-gonic/gin"
)

type TransactionHandler struct {
	transactionService services.TransactionService
	cfg                *config.Config
}

func NewTransactionHandler(cfg *config.Config) *TransactionHandler {
	transactionRepo := repositories.NewTransactionRepository()
	transactionService := services.NewTransactionService(transactionRepo)
	return &TransactionHandler{
		transactionService: transactionService,
		cfg:                cfg,
	}
}

// List returns transactions for the current user (tenant or owner)
func (h *TransactionHandler) List(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Authentication required",
			},
		})
		return
	}

	transactions, err := h.transactionService.List(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to retrieve transactions",
				"details": err.Error(),
			},
		})
		return
	}

	items := make([]TransactionResponse, len(transactions))
	for i, tx := range transactions {
		items[i] = transactionToResponse(&tx)
	}
	c.JSON(http.StatusOK, items)
}
