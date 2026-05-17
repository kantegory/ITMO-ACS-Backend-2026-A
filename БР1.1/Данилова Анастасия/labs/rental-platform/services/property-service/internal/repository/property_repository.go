package repository

import (
	"rental-platform/services/property-service/internal/models"

	"gorm.io/gorm"
)

type PropertyListFilter struct {
	City         string
	PropertyType *models.PropertyType
	MinPrice     *int
	MaxPrice     *int
	IsVerified   *bool
	IsAvailable  *bool
	AmenityIDs   []uint
	Limit        int
	Offset       int
}

type PropertyRepository struct {
	DB *gorm.DB
}

func (r *PropertyRepository) Create(property *models.Property) error {
	return r.DB.Create(property).Error
}

func (r *PropertyRepository) FindByID(id uint) (*models.Property, error) {
	var property models.Property
	err := r.DB.Preload("Amenities").Preload("Images").First(&property, id).Error
	if err != nil {
		return nil, err
	}
	return &property, nil
}

func (r *PropertyRepository) FindInternalByID(id uint) (*models.Property, error) {
	var property models.Property
	err := r.DB.Select("id", "owner_id", "is_available", "is_verified").First(&property, id).Error
	if err != nil {
		return nil, err
	}
	return &property, nil
}

func (r *PropertyRepository) List(filter PropertyListFilter) ([]models.Property, error) {
	q := r.DB.Model(&models.Property{})

	if filter.City != "" {
		q = q.Where("city ILIKE ?", "%"+filter.City+"%")
	}
	if filter.PropertyType != nil {
		q = q.Where("property_type = ?", *filter.PropertyType)
	}
	if filter.MinPrice != nil {
		q = q.Where("price_per_month >= ?", *filter.MinPrice)
	}
	if filter.MaxPrice != nil {
		q = q.Where("price_per_month <= ?", *filter.MaxPrice)
	}
	if filter.IsVerified != nil {
		q = q.Where("is_verified = ?", *filter.IsVerified)
	}
	if filter.IsAvailable != nil {
		q = q.Where("is_available = ?", *filter.IsAvailable)
	}
	if len(filter.AmenityIDs) > 0 {
		q = q.Where(
			"id IN (?)",
			r.DB.Model(&models.PropertyAmenity{}).
				Select("property_id").
				Where("amenity_id IN ?", filter.AmenityIDs).
				Group("property_id").
				Having("COUNT(DISTINCT amenity_id) = ?", len(filter.AmenityIDs)),
		)
	}

	limit := filter.Limit
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	offset := filter.Offset
	if offset < 0 {
		offset = 0
	}

	var properties []models.Property
	err := q.Order("id DESC").Limit(limit).Offset(offset).Find(&properties).Error
	return properties, err
}

func (r *PropertyRepository) ListByOwner(ownerID uint) ([]models.Property, error) {
	var properties []models.Property
	err := r.DB.Where("owner_id = ?", ownerID).Order("id DESC").Find(&properties).Error
	return properties, err
}

func (r *PropertyRepository) Save(property *models.Property) error {
	return r.DB.Save(property).Error
}

func (r *PropertyRepository) Delete(id uint) error {
	return r.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("property_id = ?", id).Delete(&models.PropertyImage{}).Error; err != nil {
			return err
		}
		if err := tx.Where("property_id = ?", id).Delete(&models.PropertyAmenity{}).Error; err != nil {
			return err
		}
		return tx.Delete(&models.Property{}, id).Error
	})
}

func (r *PropertyRepository) ReplaceAmenities(propertyID uint, amenities []models.Amenity) error {
	var property models.Property
	property.ID = propertyID
	return r.DB.Model(&property).Association("Amenities").Replace(amenities)
}

func (r *PropertyRepository) SetAvailableByOwner(ownerID uint, available bool) error {
	return r.DB.Model(&models.Property{}).
		Where("owner_id = ?", ownerID).
		Update("is_available", available).Error
}

func (r *PropertyRepository) SetAvailable(propertyID uint, available bool) error {
	return r.DB.Model(&models.Property{}).
		Where("id = ?", propertyID).
		Update("is_available", available).Error
}

func (r *PropertyRepository) Reload(property *models.Property) error {
	return r.DB.Preload("Amenities").Preload("Images").First(property, property.ID).Error
}
