package repositories

import (
	"property-service/internal/database"
	"property-service/internal/models"
	"time"

	"gorm.io/gorm"
)

type PropertyRepository interface {
	Create(property *models.Property) error
	FindByID(id uint) (*models.Property, error)
	FindAllWithFilters(filters PropertyFilters) ([]models.Property, int64, error)
	Update(property *models.Property) error
	Delete(id uint) error
	UpdateStatus(id uint, status string) error
}

type propertyRepository struct {
	db *gorm.DB
}

type PropertyFilters struct {
	City      string
	TypeID    *uint
	MinPrice  *float64
	MaxPrice  *float64
	StartDate *time.Time
	EndDate   *time.Time
	OwnerID   *uint
	Status    string
	Limit     int
	Offset    int
}

func NewPropertyRepository() PropertyRepository {
	return &propertyRepository{db: database.GetDB()}
}

func (r *propertyRepository) Create(property *models.Property) error {
	return r.db.Create(property).Error
}

func (r *propertyRepository) FindByID(id uint) (*models.Property, error) {
	var property models.Property
	err := r.db.
		Preload("Type").
		Preload("Images", func(db *gorm.DB) *gorm.DB {
			return db.Order("is_main DESC, id ASC")
		}).
		Preload("Amenities").
		First(&property, id).Error
	return &property, err
}

func (r *propertyRepository) FindAllWithFilters(filters PropertyFilters) ([]models.Property, int64, error) {
	query := r.db.Model(&models.Property{})

	if filters.Status != "" {
		query = query.Where("status = ?", filters.Status)
	} else {
		query = query.Where("status = ?", "active")
	}

	if filters.City != "" {
		query = query.Where("city LIKE ?", "%"+filters.City+"%")
	}
	if filters.TypeID != nil {
		query = query.Where("type_id = ?", *filters.TypeID)
	}
	if filters.MinPrice != nil {
		query = query.Where("price_per_day >= ?", *filters.MinPrice)
	}
	if filters.MaxPrice != nil {
		query = query.Where("price_per_day <= ?", *filters.MaxPrice)
	}
	if filters.OwnerID != nil {
		query = query.Where("owner_id = ?", *filters.OwnerID)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	query = query.Order("created_at DESC")
	if filters.Limit > 0 {
		query = query.Limit(filters.Limit)
	}
	if filters.Offset > 0 {
		query = query.Offset(filters.Offset)
	}

	var properties []models.Property
	err := query.
		Preload("Type").
		Preload("Images", func(db *gorm.DB) *gorm.DB {
			return db.Order("is_main DESC, id ASC").Limit(1)
		}).
		Preload("Amenities").
		Find(&properties).Error
	return properties, total, err
}

func (r *propertyRepository) Update(property *models.Property) error {
	return r.db.Save(property).Error
}

func (r *propertyRepository) Delete(id uint) error {
	return r.db.Delete(&models.Property{}, id).Error
}

func (r *propertyRepository) UpdateStatus(id uint, status string) error {
	return r.db.Model(&models.Property{}).Where("id = ?", id).Update("status", status).Error
}