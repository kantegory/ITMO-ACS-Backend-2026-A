package repository

import (
	"rental-platform/services/property-service/internal/models"

	"gorm.io/gorm"
)

type ImageRepository struct {
	DB *gorm.DB
}

func (r *ImageRepository) Create(image *models.PropertyImage) error {
	return r.DB.Create(image).Error
}

func (r *ImageRepository) FindByID(id uint) (*models.PropertyImage, error) {
	var image models.PropertyImage
	err := r.DB.First(&image, id).Error
	if err != nil {
		return nil, err
	}
	return &image, nil
}

func (r *ImageRepository) ListByProperty(propertyID uint) ([]models.PropertyImage, error) {
	var images []models.PropertyImage
	err := r.DB.Where("property_id = ?", propertyID).Order("id ASC").Find(&images).Error
	return images, err
}

func (r *ImageRepository) Delete(id uint) error {
	return r.DB.Delete(&models.PropertyImage{}, id).Error
}

func (r *ImageRepository) IsNotFound(err error) bool {
	return err == gorm.ErrRecordNotFound
}
