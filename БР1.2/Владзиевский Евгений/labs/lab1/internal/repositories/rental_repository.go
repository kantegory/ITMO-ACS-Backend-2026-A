package repositories

import (
	"rental-api/internal/database"
	"rental-api/internal/models"
	"time"

	"gorm.io/gorm"
)

type RentalRepository interface {
	Create(rental *models.Rental) error
	FindByID(id uint) (*models.Rental, error)
	FindAllWithFilters(filters RentalFilters) ([]models.Rental, int64, error)
	Update(rental *models.Rental) error
	Delete(id uint) error
	UpdateStatus(id uint, status string) error
	FindOverlapping(propertyID uint, startDate, endDate time.Time) ([]models.Rental, error)
}

type rentalRepository struct {
	db *gorm.DB
}

type RentalFilters struct {
	TenantID   *uint
	OwnerID    *uint
	PropertyID *uint
	Status     *string
	Limit      int
	Offset     int
}

func NewRentalRepository() RentalRepository {
	return &rentalRepository{db: database.GetDB()}
}

func (r *rentalRepository) Create(rental *models.Rental) error {
	return r.db.Create(rental).Error
}

func (r *rentalRepository) FindByID(id uint) (*models.Rental, error) {
	var rental models.Rental
	err := r.db.
		Preload("Tenant").
		Preload("Property").
		Preload("Property.Owner").
		Preload("Property.Type").
		First(&rental, id).Error
	return &rental, err
}

func (r *rentalRepository) FindAllWithFilters(filters RentalFilters) ([]models.Rental, int64, error) {
	query := r.db.Model(&models.Rental{})

	if filters.TenantID != nil {
		query = query.Where("tenant_id = ?", *filters.TenantID)
	}
	if filters.PropertyID != nil {
		query = query.Where("property_id = ?", *filters.PropertyID)
	}
	if filters.Status != nil {
		query = query.Where("status = ?", *filters.Status)
	}
	if filters.OwnerID != nil {
		// Join with properties to filter by owner_id
		query = query.Joins("JOIN properties ON rentals.property_id = properties.id").
			Where("properties.owner_id = ?", *filters.OwnerID)
	}

	// Get total count
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply ordering, limit, offset
	query = query.Order("created_at DESC")
	if filters.Limit > 0 {
		query = query.Limit(filters.Limit)
	}
	if filters.Offset > 0 {
		query = query.Offset(filters.Offset)
	}

	var rentals []models.Rental
	err := query.
		Preload("Tenant").
		Preload("Property").
		Preload("Property.Owner").
		Preload("Property.Type").
		Find(&rentals).Error
	return rentals, total, err
}

func (r *rentalRepository) Update(rental *models.Rental) error {
	return r.db.Save(rental).Error
}

func (r *rentalRepository) Delete(id uint) error {
	return r.db.Delete(&models.Rental{}, id).Error
}

func (r *rentalRepository) UpdateStatus(id uint, status string) error {
	return r.db.Model(&models.Rental{}).Where("id = ?", id).Update("status", status).Error
}

func (r *rentalRepository) FindOverlapping(propertyID uint, startDate, endDate time.Time) ([]models.Rental, error) {
	var rentals []models.Rental
	// Find rentals that overlap with the given interval, excluding cancelled and finished
	err := r.db.
		Where("property_id = ?", propertyID).
		Where("status NOT IN (?)", []string{"cancelled", "finished"}).
		Where("(start_date <= ? AND end_date >= ?) OR (start_date <= ? AND end_date >= ?)",
			endDate, startDate,
			startDate, endDate).
		Find(&rentals).Error
	return rentals, err
}
