package repositories

import (
	"booking-service/internal/database"
	"booking-service/internal/models"
	"time"
)

type RentalRepository struct{}

func NewRentalRepository() *RentalRepository {
	return &RentalRepository{}
}

func (r *RentalRepository) Create(rental *models.Rental) error {
	return database.DB.Create(rental).Error
}

func (r *RentalRepository) FindByID(id uint) (*models.Rental, error) {
	var rental models.Rental
	err := database.DB.First(&rental, id).Error
	return &rental, err
}

func (r *RentalRepository) FindAllWithFilters(tenantID, ownerID, propertyID *uint, status *string) ([]models.Rental, error) {
	var rentals []models.Rental
	query := database.DB.Model(&models.Rental{})

	if tenantID != nil {
		query = query.Where("tenant_id = ?", *tenantID)
	}
	if ownerID != nil {
		query = query.Where("owner_id = ?", *ownerID)
	}
	if propertyID != nil {
		query = query.Where("property_id = ?", *propertyID)
	}
	if status != nil {
		query = query.Where("status = ?", *status)
	}

	err := query.Order("created_at DESC").Find(&rentals).Error
	return rentals, err
}

func (r *RentalRepository) Update(rental *models.Rental) error {
	return database.DB.Save(rental).Error
}

func (r *RentalRepository) FindOverlapping(propertyID uint, startDate, endDate time.Time, excludeID *uint) ([]models.Rental, error) {
	var rentals []models.Rental
	query := database.DB.Where("property_id = ? AND status NOT IN (?, ?)", propertyID, "cancelled", "finished").
		Where("start_date < ? AND end_date > ?", endDate, startDate)

	if excludeID != nil {
		query = query.Where("id != ?", *excludeID)
	}

	err := query.Find(&rentals).Error
	return rentals, err
}

func (r *RentalRepository) UpdateStatus(id uint, status string) error {
	return database.DB.Model(&models.Rental{}).Where("id = ?", id).Update("status", status).Error
}