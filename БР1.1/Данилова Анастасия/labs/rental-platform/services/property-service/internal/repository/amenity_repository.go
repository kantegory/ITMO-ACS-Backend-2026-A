package repository

import (
	"rental-platform/services/property-service/internal/models"

	"gorm.io/gorm"
)

type AmenityRepository struct {
	DB *gorm.DB
}

func (r *AmenityRepository) Create(amenity *models.Amenity) error {
	return r.DB.Create(amenity).Error
}

func (r *AmenityRepository) FindByID(id uint) (*models.Amenity, error) {
	var amenity models.Amenity
	err := r.DB.First(&amenity, id).Error
	if err != nil {
		return nil, err
	}
	return &amenity, nil
}

func (r *AmenityRepository) FindByName(name string) (*models.Amenity, error) {
	var amenity models.Amenity
	err := r.DB.Where("name = ?", name).First(&amenity).Error
	if err != nil {
		return nil, err
	}
	return &amenity, nil
}

func (r *AmenityRepository) FindByNameExcluding(name string, excludeID uint) (*models.Amenity, error) {
	var amenity models.Amenity
	err := r.DB.Where("name = ? AND id != ?", name, excludeID).First(&amenity).Error
	if err != nil {
		return nil, err
	}
	return &amenity, nil
}

func (r *AmenityRepository) List() ([]models.Amenity, error) {
	var amenities []models.Amenity
	err := r.DB.Order("name ASC").Find(&amenities).Error
	return amenities, err
}

func (r *AmenityRepository) Save(amenity *models.Amenity) error {
	return r.DB.Save(amenity).Error
}

func (r *AmenityRepository) Delete(id uint) error {
	return r.DB.Delete(&models.Amenity{}, id).Error
}

func (r *AmenityRepository) FindByIDs(ids []uint) ([]models.Amenity, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	var amenities []models.Amenity
	err := r.DB.Where("id IN ?", ids).Find(&amenities).Error
	return amenities, err
}

func (r *AmenityRepository) CountPropertyUsage(amenityID uint) (int64, error) {
	var count int64
	err := r.DB.Model(&models.PropertyAmenity{}).Where("amenity_id = ?", amenityID).Count(&count).Error
	return count, err
}

func (r *AmenityRepository) IsNotFound(err error) bool {
	return err == gorm.ErrRecordNotFound
}
