package repositories

import (
	"payment-service/internal/database"
	"payment-service/internal/models"

	"gorm.io/gorm"
)

type TransactionRepository struct{}

func NewTransactionRepository() *TransactionRepository {
	return &TransactionRepository{}
}

func (r *TransactionRepository) Create(transaction *models.Transaction) error {
	return database.DB.Create(transaction).Error
}

func (r *TransactionRepository) FindByID(id uint) (*models.Transaction, error) {
	var transaction models.Transaction
	err := database.DB.First(&transaction, id).Error
	return &transaction, err
}

func (r *TransactionRepository) FindAllByUserID(tenantID int) ([]models.Transaction, error) {
	var transactions []models.Transaction
	err := database.DB.Where("tenant_id = ?", tenantID).Order("created_at DESC").Find(&transactions).Error
	return transactions, err
}

func (r *TransactionRepository) FindByRentalID(rentalID int) ([]models.Transaction, error) {
	var transactions []models.Transaction
	err := database.DB.Where("rental_id = ?", rentalID).Order("created_at DESC").Find(&transactions).Error
	return transactions, err
}

func (r *TransactionRepository) FindByIdempotencyKey(key string) (*models.Transaction, error) {
	var transaction models.Transaction
	err := database.DB.Where("idempotency_key = ?", key).First(&transaction).Error
	return &transaction, err
}

func (r *TransactionRepository) Update(transaction *models.Transaction) error {
	return database.DB.Save(transaction).Error
}

func (r *TransactionRepository) DB() *gorm.DB {
	return database.DB
}