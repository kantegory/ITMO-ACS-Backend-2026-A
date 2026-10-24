package repository

import (
	"rental-platform/services/chat-service/internal/models"

	"gorm.io/gorm"
)

type ChatRepository struct {
	DB *gorm.DB
}

func (r *ChatRepository) Create(chat *models.Chat) error {
	return r.DB.Create(chat).Error
}

func (r *ChatRepository) GetByID(id uint) (*models.Chat, error) {
	var chat models.Chat
	err := r.DB.First(&chat, id).Error
	if err != nil {
		return nil, err
	}
	return &chat, nil
}

func (r *ChatRepository) FindByPropertyAndTenant(propertyID, tenantID uint) (*models.Chat, error) {
	var chat models.Chat
	err := r.DB.Where("property_id = ? AND tenant_id = ?", propertyID, tenantID).First(&chat).Error
	if err != nil {
		return nil, err
	}
	return &chat, nil
}

func (r *ChatRepository) ListForUser(userID uint, propertyID *uint, limit, offset int) ([]models.Chat, error) {
	q := r.DB.Model(&models.Chat{}).
		Where("is_archived = ?", false).
		Where("tenant_id = ? OR landlord_id = ?", userID, userID)
	if propertyID != nil {
		q = q.Where("property_id = ?", *propertyID)
	}
	var chats []models.Chat
	err := q.Order("created_at DESC").Limit(limit).Offset(offset).Find(&chats).Error
	return chats, err
}

func (r *ChatRepository) Delete(id uint) error {
	return r.DB.Delete(&models.Chat{}, id).Error
}

func (r *ChatRepository) ArchiveByUserID(userID uint) error {
	return r.DB.Model(&models.Chat{}).
		Where("tenant_id = ? OR landlord_id = ?", userID, userID).
		Update("is_archived", true).Error
}

func (r *ChatRepository) CountByProperty(propertyID uint) (int64, error) {
	var count int64
	err := r.DB.Model(&models.Chat{}).Where("property_id = ?", propertyID).Count(&count).Error
	return count, err
}

func (r *ChatRepository) LastMessagePreview(chatID uint) (string, bool) {
	var msg models.Message
	err := r.DB.Where("chat_id = ?", chatID).Order("created_at DESC").First(&msg).Error
	if err != nil {
		return "", false
	}
	return msg.Text, true
}
