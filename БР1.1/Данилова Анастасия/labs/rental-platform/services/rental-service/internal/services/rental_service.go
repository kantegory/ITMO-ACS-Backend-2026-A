package services

import (
	"context"
	"errors"
	"time"

	"rental-platform/services/rental-service/internal/clients"
	"rental-platform/services/rental-service/internal/models"
	"rental-platform/services/rental-service/internal/repository"
	"rental-platform/shared/dto/events"
	"rental-platform/shared/rabbitmq"

	"gorm.io/gorm"
)

var (
	ErrNotFound        = errors.New("rental not found")
	ErrForbidden       = errors.New("forbidden")
	ErrConflict        = errors.New("conflict")
	ErrBadRequest      = errors.New("bad request")
	ErrPropertyRented  = errors.New("property already rented")
	ErrPropertyMissing = errors.New("property not found")
)

type RentalService struct {
	Rentals  *repository.RentalRepository
	Property *clients.PropertyClient
	Auth     *clients.AuthClient
	Publisher *rabbitmq.Publisher
}

type CreateRentalInput struct {
	PropertyID uint
	StartDate  time.Time
	EndDate    time.Time
	TenantID   uint
}

type RentalFull struct {
	models.Rental
	Property any `json:"property,omitempty"`
}

func IsNotFound(err error) bool {
	return errors.Is(err, gorm.ErrRecordNotFound) || errors.Is(err, ErrNotFound)
}

func (s *RentalService) Create(ctx context.Context, in CreateRentalInput) (*RentalFull, error) {
	if !in.EndDate.After(in.StartDate) {
		return nil, ErrBadRequest
	}

	exists, err := s.Auth.UserExists(ctx, in.TenantID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, ErrBadRequest
	}

	prop, err := s.Property.GetInternal(ctx, in.PropertyID)
	if err != nil {
		if errors.Is(err, clients.ErrNotFound) {
			return nil, ErrPropertyMissing
		}
		return nil, err
	}
	if !prop.IsAvailable {
		return nil, ErrPropertyRented
	}

	active, _, err := s.Rentals.HasActiveRental(in.PropertyID)
	if err != nil {
		return nil, err
	}
	if active {
		return nil, ErrPropertyRented
	}

	if in.TenantID == prop.OwnerID {
		return nil, ErrBadRequest
	}

	public, err := s.Property.GetPublic(ctx, in.PropertyID)
	if err != nil {
		if errors.Is(err, clients.ErrNotFound) {
			return nil, ErrPropertyMissing
		}
		return nil, err
	}

	totalPrice := calculateTotalPrice(in.StartDate, in.EndDate, public.PricePerMonth)

	rental := &models.Rental{
		PropertyID: in.PropertyID,
		TenantID:   in.TenantID,
		LandlordID: prop.OwnerID,
		StartDate:  dateOnly(in.StartDate),
		EndDate:    dateOnly(in.EndDate),
		TotalPrice: totalPrice,
		Status:     models.StatusPending,
	}
	if err := s.Rentals.Create(rental); err != nil {
		return nil, err
	}

	s.publishCreated(ctx, rental)

	return s.toRentalFull(ctx, rental)
}

func (s *RentalService) Get(ctx context.Context, rentalID, userID uint) (*RentalFull, error) {
	rental, err := s.Rentals.GetByID(rentalID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	if !canAccess(rental, userID) {
		return nil, ErrForbidden
	}
	return s.toRentalFull(ctx, rental)
}

func (s *RentalService) List(userID uint, role, status string, limit, offset int) ([]models.Rental, error) {
	return s.Rentals.List(repository.RentalFilter{
		UserID: userID,
		Role:   role,
		Status: status,
		Limit:  limit,
		Offset: offset,
	})
}

func (s *RentalService) Dashboard(userID uint) (tenant, landlord []models.Rental, err error) {
	tenant, err = s.Rentals.ListAsTenant(userID)
	if err != nil {
		return nil, nil, err
	}
	landlord, err = s.Rentals.ListAsLandlord(userID)
	return tenant, landlord, err
}

func (s *RentalService) Cancel(ctx context.Context, rentalID, userID uint) error {
	rental, err := s.Rentals.GetByID(rentalID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrNotFound
		}
		return err
	}
	if !canAccess(rental, userID) {
		return ErrForbidden
	}
	switch rental.Status {
	case models.StatusPending, models.StatusApproved, models.StatusActive:
	default:
		return ErrConflict
	}
	rental.Status = models.StatusCancelled
	if err := s.Rentals.Save(rental); err != nil {
		return err
	}
	s.publishStatusChanged(ctx, rental)
	return nil
}

func (s *RentalService) Approve(ctx context.Context, rentalID, userID uint) (*RentalFull, error) {
	rental, err := s.Rentals.GetByID(rentalID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	if rental.LandlordID != userID {
		return nil, ErrForbidden
	}
	if rental.Status != models.StatusPending {
		return nil, ErrConflict
	}

	rental.Status = models.StatusActive
	if err := s.Rentals.Save(rental); err != nil {
		return nil, err
	}
	s.publishStatusChanged(ctx, rental)
	return s.toRentalFull(ctx, rental)
}

func (s *RentalService) Reject(ctx context.Context, rentalID, userID uint) (*RentalFull, error) {
	rental, err := s.Rentals.GetByID(rentalID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	if rental.LandlordID != userID {
		return nil, ErrForbidden
	}
	if rental.Status != models.StatusPending {
		return nil, ErrConflict
	}

	rental.Status = models.StatusRejected
	if err := s.Rentals.Save(rental); err != nil {
		return nil, err
	}
	s.publishStatusChanged(ctx, rental)
	return s.toRentalFull(ctx, rental)
}

func (s *RentalService) Complete(ctx context.Context, rentalID, userID uint) (*RentalFull, error) {
	rental, err := s.Rentals.GetByID(rentalID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	if !canAccess(rental, userID) {
		return nil, ErrForbidden
	}
	if rental.Status != models.StatusActive {
		return nil, ErrConflict
	}

	rental.Status = models.StatusCompleted
	if err := s.Rentals.Save(rental); err != nil {
		return nil, err
	}

	if s.Publisher != nil {
		_ = s.Publisher.Publish(ctx, events.RentalCompleted, events.RentalCompletedPayload{
			RentalID:   rental.ID,
			PropertyID: rental.PropertyID,
		})
	}
	s.publishStatusChanged(ctx, rental)
	return s.toRentalFull(ctx, rental)
}

func (s *RentalService) PropertyActiveStatus(propertyID uint) (bool, *uint, error) {
	active, rental, err := s.Rentals.HasActiveRental(propertyID)
	if err != nil {
		return false, nil, err
	}
	if !active {
		return false, nil, nil
	}
	id := rental.ID
	return true, &id, nil
}

func (s *RentalService) HandleUserDeleted(ctx context.Context, userID uint) error {
	rentals, err := s.Rentals.CancelActiveOrPendingByUser(userID)
	if err != nil {
		return err
	}
	for i := range rentals {
		s.publishStatusChanged(ctx, &rentals[i])
	}
	return nil
}

func (s *RentalService) toRentalFull(ctx context.Context, rental *models.Rental) (*RentalFull, error) {
	full := &RentalFull{Rental: *rental}
	prop, err := s.Property.GetPublic(ctx, rental.PropertyID)
	if err == nil {
		full.Property = prop
	}
	return full, nil
}

func (s *RentalService) publishCreated(ctx context.Context, rental *models.Rental) {
	if s.Publisher == nil {
		return
	}
	_ = s.Publisher.Publish(ctx, events.RentalCreated, events.RentalCreatedPayload{
		RentalID:   rental.ID,
		PropertyID: rental.PropertyID,
		TenantID:   rental.TenantID,
		LandlordID: rental.LandlordID,
	})
}

func (s *RentalService) publishStatusChanged(ctx context.Context, rental *models.Rental) {
	if s.Publisher == nil {
		return
	}
	_ = s.Publisher.Publish(ctx, events.RentalStatusChanged, events.RentalStatusPayload{
		RentalID:   rental.ID,
		PropertyID: rental.PropertyID,
		Status:     string(rental.Status),
	})
}

func canAccess(rental *models.Rental, userID uint) bool {
	return rental.TenantID == userID || rental.LandlordID == userID
}

func calculateTotalPrice(start, end time.Time, pricePerMonth int) int {
	months := (end.Year()-start.Year())*12 + int(end.Month()-start.Month())
	if end.Day() > start.Day() {
		months++
	}
	if months < 1 {
		months = 1
	}
	return months * pricePerMonth
}

func dateOnly(t time.Time) time.Time {
	y, m, d := t.Date()
	return time.Date(y, m, d, 0, 0, 0, 0, time.UTC)
}

func ParseDate(s string) (time.Time, error) {
	return time.Parse("2006-01-02", s)
}
