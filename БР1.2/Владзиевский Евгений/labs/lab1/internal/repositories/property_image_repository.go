package repositories

import (
	"rental-api/internal/database"
	"rental-api/internal/models"

	"gorm.io/gorm"
)

type PropertyImageRepository interface {
	Create(image *models.PropertyImage) error
	FindByID(id uint) (*models.PropertyImage, error)
	FindByPropertyID(propertyID uint) ([]models.PropertyImage, error)
	Delete(id uint) error
	Update(image *models.PropertyImage) error
	SetMain(imageID uint) error
}

type propertyImageRepository struct {
	db *gorm.DB
}

func NewPropertyImageRepository() PropertyImageRepository {
	return &propertyImageRepository{db: database.GetDB()}
}

func (r *propertyImageRepository) Create(image *models.PropertyImage) error {
	return r.db.Create(image).Error
}

func (r *propertyImageRepository) FindByID(id uint) (*models.PropertyImage, error) {
	var image models.PropertyImage
	err := r.db.First(&image, id).Error
	return &image, err
}

func (r *propertyImageRepository) FindByPropertyID(propertyID uint) ([]models.PropertyImage, error) {
	var images []models.PropertyImage
	err := r.db.Where("property_id = ?", propertyID).Order("is_main DESC, id ASC").Find(&images).Error
	return images, err
}

func (r *propertyImageRepository) Delete(id uint) error {
	return r.db.Delete(&models.PropertyImage{}, id).Error
}

func (r *propertyImageRepository) Update(image *models.PropertyImage) error {
	return r.db.Save(image).Error
}

func (r *propertyImageRepository) SetMain(imageID uint) error {
	// First find the image to get its property_id
	var image models.PropertyImage
	if err := r.db.First(&image, imageID).Error; err != nil {
		return err
	}
	// Start a transaction to update all images of the same property
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Set all images of this property to is_main = false
		if err := tx.Model(&models.PropertyImage{}).
			Where("property_id = ?", image.PropertyID).
			Update("is_main", false).Error; err != nil {
			return err
		}
		// Set the specified image to is_main = true
		if err := tx.Model(&models.PropertyImage{}).
			Where("id = ?", imageID).
			Update("is_main", true).Error; err != nil {
			return err
		}
		return nil
	})
}
