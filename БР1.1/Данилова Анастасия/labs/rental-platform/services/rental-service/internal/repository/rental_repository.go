package repository

import (
	"rental-platform/services/rental-service/internal/models"

	"gorm.io/gorm"
)

type RentalFilter struct {
	UserID   uint
	Role     string
	Status   string
	Limit    int
	Offset   int
}

type RentalRepository struct {
	DB *gorm.DB
}

func (r *RentalRepository) Create(rental *models.Rental) error {
	return r.DB.Create(rental).Error
}

func (r *RentalRepository) GetByID(id uint) (*models.Rental, error) {
	var rental models.Rental
	err := r.DB.First(&rental, id).Error
	if err != nil {
		return nil, err
	}
	return &rental, nil
}

func (r *RentalRepository) Save(rental *models.Rental) error {
	return r.DB.Save(rental).Error
}

func (r *RentalRepository) List(filter RentalFilter) ([]models.Rental, error) {
	q := r.DB.Model(&models.Rental{})
	q = r.applyUserRole(q, filter.UserID, filter.Role)
	if filter.Status != "" {
		q = q.Where("status = ?", filter.Status)
	}
	if filter.Limit <= 0 {
		filter.Limit = 20
	}
	var rentals []models.Rental
	err := q.Order("created_at DESC").Limit(filter.Limit).Offset(filter.Offset).Find(&rentals).Error
	return rentals, err
}

func (r *RentalRepository) ListAsTenant(userID uint) ([]models.Rental, error) {
	var rentals []models.Rental
	err := r.DB.Where("tenant_id = ?", userID).Order("created_at DESC").Find(&rentals).Error
	return rentals, err
}

func (r *RentalRepository) ListAsLandlord(userID uint) ([]models.Rental, error) {
	var rentals []models.Rental
	err := r.DB.Where("landlord_id = ?", userID).Order("created_at DESC").Find(&rentals).Error
	return rentals, err
}

func (r *RentalRepository) HasActiveRental(propertyID uint) (bool, *models.Rental, error) {
	var rental models.Rental
	err := r.DB.Where("property_id = ? AND status = ?", propertyID, models.StatusActive).First(&rental).Error
	if err == gorm.ErrRecordNotFound {
		return false, nil, nil
	}
	if err != nil {
		return false, nil, err
	}
	return true, &rental, nil
}

func (r *RentalRepository) CancelActiveOrPendingByUser(userID uint) ([]models.Rental, error) {
	var rentals []models.Rental
	err := r.DB.Where(
		"(tenant_id = ? OR landlord_id = ?) AND status IN ?",
		userID, userID, []models.RentalStatus{models.StatusPending, models.StatusActive},
	).Find(&rentals).Error
	if err != nil {
		return nil, err
	}
	if len(rentals) == 0 {
		return rentals, nil
	}
	ids := make([]uint, 0, len(rentals))
	for i := range rentals {
		ids = append(ids, rentals[i].ID)
	}
	if err := r.DB.Model(&models.Rental{}).Where("id IN ?", ids).
		Update("status", models.StatusCancelled).Error; err != nil {
		return nil, err
	}
	for i := range rentals {
		rentals[i].Status = models.StatusCancelled
	}
	return rentals, nil
}

func (r *RentalRepository) applyUserRole(q *gorm.DB, userID uint, role string) *gorm.DB {
	switch role {
	case "tenant":
		return q.Where("tenant_id = ?", userID)
	case "landlord":
		return q.Where("landlord_id = ?", userID)
	default:
		return q.Where("tenant_id = ? OR landlord_id = ?", userID, userID)
	}
}
