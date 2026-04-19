package repositories

import (
	"rental-api/internal/database"
	"rental-api/internal/models"

	"gorm.io/gorm"
)

type TransactionRepository interface {
	Create(transaction *models.Transaction) error
	FindByID(id uint) (*models.Transaction, error)
	FindAllByUserID(userID uint) ([]models.Transaction, error)
	DB() *gorm.DB
}

type transactionRepository struct {
	db *gorm.DB
}

func NewTransactionRepository() TransactionRepository {
	return &transactionRepository{db: database.GetDB()}
}

func (r *transactionRepository) DB() *gorm.DB {
	return r.db
}

func (r *transactionRepository) Create(transaction *models.Transaction) error {
	return r.db.Create(transaction).Error
}

func (r *transactionRepository) FindByID(id uint) (*models.Transaction, error) {
	var transaction models.Transaction
	err := r.db.First(&transaction, id).Error
	return &transaction, err
}

func (r *transactionRepository) FindAllByUserID(userID uint) ([]models.Transaction, error) {
	var transactions []models.Transaction
	// Join with rentals to filter by tenant or owner
	err := r.db.
		Joins("JOIN rentals ON transactions.rental_id = rentals.id").
		Where("rentals.tenant_id = ? OR rentals.property_id IN (SELECT id FROM properties WHERE owner_id = ?)", userID, userID).
		Order("transactions.created_at DESC").
		Find(&transactions).Error
	return transactions, err
}
