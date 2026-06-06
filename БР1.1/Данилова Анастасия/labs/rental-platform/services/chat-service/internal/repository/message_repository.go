package repository

import (
	"time"

	"rental-platform/services/chat-service/internal/models"

	"gorm.io/gorm"
)

type MessageRepository struct {
	DB *gorm.DB
}

func (r *MessageRepository) Create(msg *models.Message) error {
	return r.DB.Create(msg).Error
}

func (r *MessageRepository) GetByID(id uint) (*models.Message, error) {
	var msg models.Message
	err := r.DB.First(&msg, id).Error
	if err != nil {
		return nil, err
	}
	return &msg, nil
}

func (r *MessageRepository) ListByChat(chatID uint, limit, offset int) ([]models.Message, error) {
	var messages []models.Message
	err := r.DB.Where("chat_id = ?", chatID).
		Order("created_at ASC").
		Limit(limit).
		Offset(offset).
		Find(&messages).Error
	return messages, err
}

func (r *MessageRepository) Update(msg *models.Message) error {
	return r.DB.Save(msg).Error
}

func (r *MessageRepository) Delete(id uint) error {
	return r.DB.Delete(&models.Message{}, id).Error
}

func (r *MessageRepository) DeleteByChat(chatID uint) error {
	return r.DB.Where("chat_id = ?", chatID).Delete(&models.Message{}).Error
}

func (r *MessageRepository) UnreadCount(chatID, readerID uint) (int64, error) {
	var count int64
	err := r.DB.Model(&models.Message{}).
		Where("chat_id = ? AND sender_id <> ? AND is_read = ?", chatID, readerID, false).
		Count(&count).Error
	return count, err
}

func (r *MessageRepository) MarkRead(chatID, readerID uint) error {
	return r.DB.Model(&models.Message{}).
		Where("chat_id = ? AND sender_id <> ? AND is_read = ?", chatID, readerID, false).
		Update("is_read", true).Error
}

func (r *MessageRepository) TouchUpdatedAt(msg *models.Message) {
	now := time.Now().UTC()
	msg.UpdatedAt = &now
}
