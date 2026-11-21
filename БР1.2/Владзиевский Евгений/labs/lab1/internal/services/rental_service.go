package services

import (
	"errors"
	"rental-api/internal/models"
	"rental-api/internal/repositories"
	"time"

	"gorm.io/gorm"
)

type RentalService interface {
	List(filters RentalFilters, userID uint, userRole string) ([]models.Rental, int64, error)
	GetByID(id uint, userID uint, userRole string) (*models.Rental, error)
	Create(input RentalInput, tenantID uint) (*models.Rental, error)
	UpdateStatus(id uint, status string, userID uint, userRole string) (*models.Rental, error)
	Pay(id uint, paymentMethod string, tenantID uint) (*models.Rental, *models.Transaction, error)
}

type rentalService struct {
	rentalRepo      repositories.RentalRepository
	propertyRepo    repositories.PropertyRepository
	userRepo        repositories.UserRepository
	transactionRepo repositories.TransactionRepository
}

type RentalInput struct {
	PropertyID uint      `json:"property_id"`
	StartDate  time.Time `json:"start_date"`
	EndDate    time.Time `json:"end_date"`
}

type RentalFilters struct {
	Status *string `form:"status"`
	Limit  int     `form:"limit"`
	Offset int     `form:"offset"`
}

func NewRentalService(
	rentalRepo repositories.RentalRepository,
	propertyRepo repositories.PropertyRepository,
	userRepo repositories.UserRepository,
	transactionRepo repositories.TransactionRepository,
) RentalService {
	return &rentalService{
		rentalRepo:      rentalRepo,
		propertyRepo:    propertyRepo,
		userRepo:        userRepo,
		transactionRepo: transactionRepo,
	}
}

func (s *rentalService) List(filters RentalFilters, userID uint, userRole string) ([]models.Rental, int64, error) {
	repoFilters := repositories.RentalFilters{
		Status: filters.Status,
		Limit:  filters.Limit,
		Offset: filters.Offset,
	}
	// Apply tenant/owner filter
	if userRole == "tenant" {
		repoFilters.TenantID = &userID
	} else if userRole == "owner" {
		repoFilters.OwnerID = &userID
	}
	// admin sees all (no extra filter)
	return s.rentalRepo.FindAllWithFilters(repoFilters)
}

func (s *rentalService) GetByID(id uint, userID uint, userRole string) (*models.Rental, error) {
	rental, err := s.rentalRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("rental not found")
	}
	// Authorization: tenant, owner of property, or admin can view
	if userRole == "tenant" && rental.TenantID != userID {
		return nil, errors.New("forbidden")
	}
	if userRole == "owner" && rental.Property.OwnerID != userID {
		return nil, errors.New("forbidden")
	}
	// admin allowed
	return rental, nil
}

func (s *rentalService) Create(input RentalInput, tenantID uint) (*models.Rental, error) {
	// Validate dates
	if input.StartDate.Before(time.Now()) {
		return nil, errors.New("start date must be in the future")
	}
	if input.EndDate.Before(input.StartDate) {
		return nil, errors.New("end date must be after start date")
	}
	// Property must exist and be active
	property, err := s.propertyRepo.FindByID(input.PropertyID)
	if err != nil {
		return nil, errors.New("property not found")
	}
	if property.Status != "active" {
		return nil, errors.New("property is not available for booking")
	}
	// Tenant cannot book their own property
	if property.OwnerID == tenantID {
		return nil, errors.New("cannot book your own property")
	}
	// Check for overlapping bookings
	overlapping, err := s.rentalRepo.FindOverlapping(input.PropertyID, input.StartDate, input.EndDate)
	if err != nil {
		return nil, err
	}
	if len(overlapping) > 0 {
		return nil, errors.New("property already booked for the selected dates")
	}
	// Calculate total price
	days := int(input.EndDate.Sub(input.StartDate).Hours() / 24)
	if days < 1 {
		days = 1
	}
	totalPrice := property.PricePerDay * float64(days)

	rental := &models.Rental{
		TenantID:   tenantID,
		PropertyID: input.PropertyID,
		StartDate:  input.StartDate,
		EndDate:    input.EndDate,
		TotalPrice: totalPrice,
		Status:     "pending",
	}
	if err := s.rentalRepo.Create(rental); err != nil {
		return nil, err
	}
	// Reload with preloads so Property.Owner is populated in the response
	reloaded, err := s.rentalRepo.FindByID(rental.ID)
	if err != nil {
		return nil, err
	}
	return reloaded, nil
}

func (s *rentalService) UpdateStatus(id uint, status string, userID uint, userRole string) (*models.Rental, error) {
	rental, err := s.rentalRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("rental not found")
	}
	// Authorization
	if userRole == "tenant" {
		// Tenant can only cancel
		if status != "cancelled" {
			return nil, errors.New("tenant can only cancel bookings")
		}
		if rental.TenantID != userID {
			return nil, errors.New("forbidden")
		}
	} else if userRole == "owner" {
		// Owner can confirm or cancel (but not pay/finish)
		if status != "confirmed" && status != "cancelled" {
			return nil, errors.New("owner can only confirm or cancel bookings")
		}
		if rental.Property.OwnerID != userID {
			return nil, errors.New("forbidden")
		}
	}
	// Validate status transition
	allowedTransitions := map[string][]string{
		"pending":   {"confirmed", "cancelled"},
		"confirmed": {"paid", "cancelled"},
		"paid":      {"finished"},
		"cancelled": {},
		"finished":  {},
	}
	allowed, ok := allowedTransitions[rental.Status]
	if !ok {
		return nil, errors.New("invalid current status")
	}
	valid := false
	for _, s := range allowed {
		if s == status {
			valid = true
			break
		}
	}
	if !valid {
		return nil, errors.New("invalid status transition")
	}

	if err := s.rentalRepo.UpdateStatus(id, status); err != nil {
		return nil, err
	}
	rental.Status = status
	return rental, nil
}

func (s *rentalService) Pay(id uint, paymentMethod string, tenantID uint) (*models.Rental, *models.Transaction, error) {
	rental, err := s.rentalRepo.FindByID(id)
	if err != nil {
		return nil, nil, errors.New("rental not found")
	}
	if rental.TenantID != tenantID {
		return nil, nil, errors.New("forbidden")
	}
	if rental.Status != "confirmed" {
		return nil, nil, errors.New("rental must be confirmed before payment")
	}
	transaction := &models.Transaction{
		RentalID:      rental.ID,
		Amount:        rental.TotalPrice,
		PaymentMethod: &paymentMethod,
		Status:        "success",
	}

	err = s.transactionRepo.DB().Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(transaction).Error; err != nil {
			return err
		}
		if err := tx.Model(&models.Rental{}).Where("id = ?", id).Update("status", "paid").Error; err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return nil, nil, err
	}
	rental.Status = "paid"
	return rental, transaction, nil
}
