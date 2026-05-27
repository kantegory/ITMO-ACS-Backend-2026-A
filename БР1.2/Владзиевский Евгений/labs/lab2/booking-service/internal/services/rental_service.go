package services

import (
	"booking-service/internal/client"
	ekafka "booking-service/internal/kafka"
	"booking-service/internal/models"
	"booking-service/internal/repositories"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type RentalService struct {
	repo           *repositories.RentalRepository
	authClient     *client.AuthClient
	propertyClient *client.PropertyClient
	paymentClient  *client.PaymentClient
	outboxRepo     *repositories.OutboxRepository
}

func NewRentalService(
	repo *repositories.RentalRepository,
	authClient *client.AuthClient,
	propertyClient *client.PropertyClient,
	paymentClient *client.PaymentClient,
	outboxRepo *repositories.OutboxRepository,
) *RentalService {
	return &RentalService{
		repo:           repo,
		authClient:     authClient,
		propertyClient: propertyClient,
		paymentClient:  paymentClient,
		outboxRepo:     outboxRepo,
	}
}

type CreateRentalInput struct {
	PropertyID uint      `json:"property_id" binding:"required"`
	StartDate  time.Time `json:"start_date" binding:"required"`
	EndDate    time.Time `json:"end_date" binding:"required"`
}

type UpdateStatusInput struct {
	Status string `json:"status" binding:"required"`
}

var validTransitions = map[string][]string{
	"pending":         {"confirmed", "cancelled"},
	"confirmed":       {"paid", "payment_pending", "cancelled"},
	"payment_pending": {"paid", "cancelled"},
	"paid":            {"finished"},
	"cancelled":       {},
	"finished":        {},
}

func isValidTransition(current, next string) bool {
	allowed, exists := validTransitions[current]
	if !exists {
		return false
	}
	for _, s := range allowed {
		if s == next {
			return true
		}
	}
	return false
}

func (s *RentalService) List(tenantID, ownerID, propertyID *uint, status *string) ([]models.Rental, error) {
	return s.repo.FindAllWithFilters(tenantID, ownerID, propertyID, status)
}

func (s *RentalService) Create(tenantID uint, input CreateRentalInput) (*models.Rental, error) {
	if input.StartDate.After(input.EndDate) || input.StartDate.Equal(input.EndDate) {
		return nil, errors.New("start_date must be before end_date")
	}

	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	if input.StartDate.Before(today) {
		return nil, errors.New("start_date cannot be in the past")
	}

	property, err := s.propertyClient.GetPropertyByID(input.PropertyID)
	if err != nil {
		return nil, fmt.Errorf("property not found: %w", err)
	}

	if property["status"] != "active" {
		return nil, errors.New("property is not available for booking")
	}

	ownerIDFloat, _ := property["owner_id"].(float64)
	ownerID := uint(ownerIDFloat)
	if ownerID == tenantID {
		return nil, errors.New("tenant cannot book their own property")
	}

	pricePerDayFloat, _ := property["price_per_day"].(float64)
	pricePerDay := pricePerDayFloat

	days := int(input.EndDate.Sub(input.StartDate).Hours() / 24)
	if days <= 0 {
		days = 1
	}
	totalPrice := pricePerDay * float64(days)

	overlapping, err := s.repo.FindOverlapping(input.PropertyID, input.StartDate, input.EndDate, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to check availability: %w", err)
	}
	if len(overlapping) > 0 {
		return nil, errors.New("property is already booked for the selected dates")
	}

	rental := &models.Rental{
		TenantID:   tenantID,
		PropertyID: input.PropertyID,
		OwnerID:    ownerID,
		StartDate:  input.StartDate,
		EndDate:    input.EndDate,
		TotalPrice: totalPrice,
		Status:     "pending",
	}

	if err := s.repo.Create(rental); err != nil {
		return nil, fmt.Errorf("failed to create rental: %w", err)
	}

	publishOutboxEvent(s.outboxRepo, "rental", rental.ID, "rental.created", map[string]interface{}{
		"id":          rental.ID,
		"tenant_id":   rental.TenantID,
		"property_id": rental.PropertyID,
		"owner_id":    rental.OwnerID,
		"start_date":  rental.StartDate.Format("2006-01-02"),
		"end_date":    rental.EndDate.Format("2006-01-02"),
		"total_price": rental.TotalPrice,
		"status":      rental.Status,
	})

	return rental, nil
}

func (s *RentalService) GetByID(id uint, userID uint, userRole string) (*models.Rental, error) {
	rental, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New("rental not found")
	}

	if userRole != "admin" && rental.TenantID != userID && rental.OwnerID != userID {
		return nil, errors.New("access denied")
	}

	return rental, nil
}

func (s *RentalService) UpdateStatus(id uint, userID uint, userRole string, newStatus string) (*models.Rental, error) {
	rental, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New("rental not found")
	}

	if !isValidTransition(rental.Status, newStatus) {
		return nil, fmt.Errorf("invalid status transition from %s to %s", rental.Status, newStatus)
	}

	switch newStatus {
	case "confirmed":
		if userRole != "owner" && userRole != "admin" {
			if rental.OwnerID != userID {
				return nil, errors.New("only the property owner can confirm a rental")
			}
		}
	case "cancelled":
		if userRole != "admin" && rental.TenantID != userID && rental.OwnerID != userID {
			return nil, errors.New("only the tenant, owner, or admin can cancel a rental")
		}
	case "finished":
		if userRole != "admin" && rental.OwnerID != userID {
			return nil, errors.New("only the property owner or admin can finish a rental")
		}
	case "paid":
		return nil, errors.New("use the pay endpoint to mark a rental as paid")
	}

	if err := s.repo.UpdateStatus(id, newStatus); err != nil {
		return nil, fmt.Errorf("failed to update rental status: %w", err)
	}

	updated, _ := s.repo.FindByID(id)
	publishOutboxEvent(s.outboxRepo, "rental", id, "rental.status_changed", map[string]interface{}{
		"id":          updated.ID,
		"tenant_id":   updated.TenantID,
		"property_id": updated.PropertyID,
		"owner_id":    updated.OwnerID,
		"status":      updated.Status,
		"new_status":  newStatus,
	})

	return updated, nil
}

type PayResult struct {
	Rental       *models.Rental           `json:"rental"`
	Transaction  map[string]interface{}   `json:"transaction,omitempty"`
}

func (s *RentalService) SagaPayOrchestrate(rentalID uint, tenantID uint, paymentMethod string, idempotencyKey string) (*PayResult, error) {
	rental, err := s.repo.FindByID(rentalID)
	if err != nil {
		return nil, errors.New("rental not found")
	}

	if rental.TenantID != tenantID {
		return nil, errors.New("only the tenant can pay for a rental")
	}

	if rental.Status != "confirmed" {
		return nil, fmt.Errorf("rental cannot be paid in status %s, expected confirmed", rental.Status)
	}

	if err := s.repo.UpdateStatus(rentalID, "payment_pending"); err != nil {
		return nil, fmt.Errorf("failed to update rental status to payment_pending: %w", err)
	}

	publishOutboxEvent(s.outboxRepo, "rental", rentalID, "rental.status_changed", map[string]interface{}{
		"id":          rentalID,
		"status":      "payment_pending",
		"new_status":  "payment_pending",
	})

	var transaction map[string]interface{}
	var paymentErr error

	maxRetries := 3
	for attempt := 1; attempt <= maxRetries; attempt++ {
		transaction, paymentErr = s.paymentClient.CreatePayment(rentalID, tenantID, rental.TotalPrice, paymentMethod, idempotencyKey)
		if paymentErr == nil {
			break
		}

		if attempt < maxRetries {
			backoff := time.Duration(attempt*attempt) * time.Second
			time.Sleep(backoff)
		}
	}

	if paymentErr != nil {
		_ = s.repo.UpdateStatus(rentalID, "confirmed")
		publishOutboxEvent(s.outboxRepo, "rental", rentalID, "rental.status_changed", map[string]interface{}{
			"id":          rentalID,
			"status":      "confirmed",
			"new_status":  "confirmed",
		})
		return nil, fmt.Errorf("payment failed: %w", paymentErr)
	}

	rental, _ = s.repo.FindByID(rentalID)

	return &PayResult{
		Rental:       rental,
		Transaction:  transaction,
	}, nil
}

func publishOutboxEvent(outboxRepo *repositories.OutboxRepository, aggregateType string, aggregateID uint, eventType string, data interface{}) {
	dto := ekafka.OutboxEventDTO{
		EventID:       uuid.New().String(),
		EventType:     eventType,
		AggregateType: aggregateType,
		AggregateID:   aggregateID,
		Timestamp:     time.Now().UTC().Format(time.RFC3339),
		Data:          data,
		Source:        "booking-service",
	}

	payload, _ := json.Marshal(dto)
	event := &models.OutboxEvent{
		AggregateType: aggregateType,
		AggregateID:   aggregateID,
		EventType:     eventType,
		Payload:       string(payload),
		Status:        "pending",
	}

	_ = outboxRepo.Create(nil, event)
}
