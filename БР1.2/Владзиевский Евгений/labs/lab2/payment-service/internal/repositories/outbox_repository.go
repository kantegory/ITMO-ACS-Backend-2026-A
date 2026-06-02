package repositories

import (
	"payment-service/internal/database"
	"payment-service/internal/models"
	"time"

	"gorm.io/gorm"
)

type OutboxRepository struct{}

func NewOutboxRepository() *OutboxRepository {
	return &OutboxRepository{}
}

func (r *OutboxRepository) Create(db *gorm.DB, event *models.OutboxEvent) error {
	return db.Create(event).Error
}

func (r *OutboxRepository) FindPending() ([]models.OutboxEvent, error) {
	var events []models.OutboxEvent
	err := database.DB.Where("status = ?", "pending").
		Order("created_at ASC").
		Limit(100).
		Find(&events).Error
	return events, err
}

func (r *OutboxRepository) MarkPublished(id uint) error {
	now := time.Now()
	return database.DB.Model(&models.OutboxEvent{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":       "published",
			"published_at": now,
		}).Error
}

func (r *OutboxRepository) IncrementRetry(id uint) error {
	return database.DB.Model(&models.OutboxEvent{}).
		Where("id = ?", id).
		UpdateColumn("retry_count", gorm.Expr("retry_count + 1")).Error
}
