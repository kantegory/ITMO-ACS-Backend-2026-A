package repositories

import (
	"rental-api/internal/database"
	"rental-api/internal/models"

	"gorm.io/gorm"
)

type AmenityRepository interface {
	Create(amenity *models.Amenity) error
	FindByID(id uint) (*models.Amenity, error)
	FindAll() ([]models.Amenity, error)
	Delete(id uint) error
}

type amenityRepository struct {
	db *gorm.DB
}

func NewAmenityRepository() AmenityRepository {
	return &amenityRepository{db: database.GetDB()}
}

func (r *amenityRepository) Create(amenity *models.Amenity) error {
	return r.db.Create(amenity).Error
}

func (r *amenityRepository) FindByID(id uint) (*models.Amenity, error) {
	var amenity models.Amenity
	err := r.db.First(&amenity, id).Error
	return &amenity, err
}

func (r *amenityRepository) FindAll() ([]models.Amenity, error) {
	var amenities []models.Amenity
	err := r.db.Order("name ASC").Find(&amenities).Error
	return amenities, err
}

func (r *amenityRepository) Delete(id uint) error {
	return r.db.Delete(&models.Amenity{}, id).Error
}
