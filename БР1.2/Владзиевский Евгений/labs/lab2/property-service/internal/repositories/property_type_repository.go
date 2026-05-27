package repositories

import (
	"property-service/internal/database"
	"property-service/internal/models"

	"gorm.io/gorm"
)

type PropertyTypeRepository interface {
	FindAll() ([]models.PropertyType, error)
	FindByID(id uint) (*models.PropertyType, error)
	FindByName(name string) (*models.PropertyType, error)
	Create(propertyType *models.PropertyType) error
	Update(propertyType *models.PropertyType) error
	Delete(id uint) error
}

type propertyTypeRepository struct {
	db *gorm.DB
}

func NewPropertyTypeRepository() PropertyTypeRepository {
	return &propertyTypeRepository{db: database.GetDB()}
}

func (r *propertyTypeRepository) FindAll() ([]models.PropertyType, error) {
	var types []models.PropertyType
	err := r.db.Order("id").Find(&types).Error
	return types, err
}

func (r *propertyTypeRepository) FindByID(id uint) (*models.PropertyType, error) {
	var pt models.PropertyType
	err := r.db.First(&pt, id).Error
	return &pt, err
}

func (r *propertyTypeRepository) FindByName(name string) (*models.PropertyType, error) {
	var pt models.PropertyType
	err := r.db.Where("name = ?", name).First(&pt).Error
	return &pt, err
}

func (r *propertyTypeRepository) Create(propertyType *models.PropertyType) error {
	return r.db.Create(propertyType).Error
}

func (r *propertyTypeRepository) Update(propertyType *models.PropertyType) error {
	return r.db.Save(propertyType).Error
}

func (r *propertyTypeRepository) Delete(id uint) error {
	return r.db.Delete(&models.PropertyType{}, id).Error
}