package kafka

import (
	"encoding/json"
	"fmt"
	"log"

	"booking-service/internal/database"
)

type PaymentCompletedData struct {
	RentalID      uint    `json:"rental_id"`
	TransactionID uint    `json:"transaction_id"`
	TenantID      uint    `json:"tenant_id"`
	Amount        float64 `json:"amount"`
	PaymentMethod string  `json:"payment_method"`
	Status        string  `json:"status"`
}

type PaymentFailedData struct {
	RentalID uint    `json:"rental_id"`
	TenantID uint    `json:"tenant_id"`
	Amount   float64 `json:"amount"`
	Error    string  `json:"error"`
}

type PaymentRefundedData struct {
	RentalID      uint    `json:"rental_id"`
	TransactionID uint    `json:"transaction_id"`
	Amount        float64 `json:"amount"`
}

func PaymentCompletedHandler(envelope EventEnvelope) error {
	var data PaymentCompletedData
	if err := json.Unmarshal(envelope.Data, &data); err != nil {
		return fmt.Errorf("failed to unmarshal payment.completed data: %w", err)
	}

	log.Printf("Processing payment.completed for rental %d", data.RentalID)

	err := database.DB.Table("rentals").
		Where("id = ?", data.RentalID).
		Update("status", "paid").Error
	if err != nil {
		return fmt.Errorf("failed to update rental %d to paid: %w", data.RentalID, err)
	}
	return nil
}

func PaymentFailedHandler(envelope EventEnvelope) error {
	var data PaymentFailedData
	if err := json.Unmarshal(envelope.Data, &data); err != nil {
		return fmt.Errorf("failed to unmarshal payment.failed data: %w", err)
	}

	log.Printf("Processing payment.failed for rental %d", data.RentalID)

	err := database.DB.Table("rentals").
		Where("id = ? AND status = ?", data.RentalID, "payment_pending").
		Update("status", "confirmed").Error
	if err != nil {
		return fmt.Errorf("failed to rollback rental %d to confirmed: %w", data.RentalID, err)
	}
	return nil
}

func PaymentRefundedHandler(envelope EventEnvelope) error {
	var data PaymentRefundedData
	if err := json.Unmarshal(envelope.Data, &data); err != nil {
		return fmt.Errorf("failed to unmarshal payment.refunded data: %w", err)
	}

	log.Printf("Processing payment.refunded for rental %d", data.RentalID)

	err := database.DB.Table("rentals").
		Where("id = ?", data.RentalID).
		Update("status", "cancelled").Error
	if err != nil {
		return fmt.Errorf("failed to update rental %d to cancelled: %w", data.RentalID, err)
	}
	return nil
}
