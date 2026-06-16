package services

import (
	"rental-api/internal/models"
	"rental-api/internal/repositories"
)

type TransactionService interface {
	List(userID uint) ([]models.Transaction, error)
}

type transactionService struct {
	transactionRepo repositories.TransactionRepository
}

func NewTransactionService(transactionRepo repositories.TransactionRepository) TransactionService {
	return &transactionService{
		transactionRepo: transactionRepo,
	}
}

func (s *transactionService) List(userID uint) ([]models.Transaction, error) {
	return s.transactionRepo.FindAllByUserID(userID)
}
