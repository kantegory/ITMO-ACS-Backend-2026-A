package services

import (
	"errors"
	"payment-service/internal/models"
	"payment-service/internal/repositories"
)

type TransactionService struct {
	transactionRepo *repositories.TransactionRepository
}

func NewTransactionService(transactionRepo *repositories.TransactionRepository) *TransactionService {
	return &TransactionService{transactionRepo: transactionRepo}
}

func (s *TransactionService) List(tenantID int) ([]models.Transaction, error) {
	return s.transactionRepo.FindAllByUserID(tenantID)
}

type CreatePaymentInput struct {
	RentalID       int     `json:"rental_id"`
	TenantID       int     `json:"tenant_id"`
	Amount         float64 `json:"amount"`
	PaymentMethod  string  `json:"payment_method"`
	IdempotencyKey string  `json:"idempotency_key"`
}

func (s *TransactionService) CreatePayment(input CreatePaymentInput) (*models.Transaction, error) {
	if input.IdempotencyKey != "" {
		existing, err := s.transactionRepo.FindByIdempotencyKey(input.IdempotencyKey)
		if err == nil && existing.ID != 0 {
			return existing, errors.New("idempotency_key already exists")
		}
	}

	transaction := &models.Transaction{
		RentalID:       input.RentalID,
		TenantID:       input.TenantID,
		Amount:         input.Amount,
		PaymentMethod:  input.PaymentMethod,
		IdempotencyKey: input.IdempotencyKey,
		Type:           "payment",
		Status:         "success",
	}

	if err := s.transactionRepo.Create(transaction); err != nil {
		return nil, err
	}

	return transaction, nil
}

type CreateRefundInput struct {
	TransactionID int    `json:"transaction_id"`
	RentalID      int    `json:"rental_id"`
	TenantID      int    `json:"tenant_id"`
}

func (s *TransactionService) CreateRefund(input CreateRefundInput) (*models.Transaction, error) {
	original, err := s.transactionRepo.FindByID(uint(input.TransactionID))
	if err != nil {
		return nil, errors.New("original transaction not found")
	}

	if original.Type != "payment" {
		return nil, errors.New("can only refund payment transactions")
	}

	if original.Status == "refunded" {
		return nil, errors.New("transaction already refunded")
	}

	original.Status = "refunded"
	if err := s.transactionRepo.Update(original); err != nil {
		return nil, err
	}

	refund := &models.Transaction{
		RentalID:      input.RentalID,
		TenantID:      input.TenantID,
		Amount:        original.Amount,
		PaymentMethod: original.PaymentMethod,
		Type:          "refund",
		Status:        "success",
	}

	if err := s.transactionRepo.Create(refund); err != nil {
		return nil, err
	}

	return refund, nil
}

func (s *TransactionService) GetByRentalID(rentalID int) ([]models.Transaction, error) {
	return s.transactionRepo.FindByRentalID(rentalID)
}