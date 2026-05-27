package repositories

import (
	"messaging-service/internal/database"
	"messaging-service/internal/models"

	"gorm.io/gorm"
)

type MessageRepository interface {
	Create(message *models.Message) error
	FindConversations(userID int) ([]Conversation, error)
	FindHistory(propertyID, userID, otherUserID int) ([]models.Message, error)
}

type messageRepository struct {
	db *gorm.DB
}

type Conversation struct {
	PropertyID  int    `json:"property_id"`
	SenderID    int    `json:"sender_id"`
	ReceiverID  int    `json:"receiver_id"`
	LastMessage  string `json:"last_message"`
	LastSentAt   string `json:"last_sent_at"`
}

func NewMessageRepository() MessageRepository {
	return &messageRepository{db: database.GetDB()}
}

func (r *messageRepository) Create(message *models.Message) error {
	return r.db.Create(message).Error
}

func (r *messageRepository) FindConversations(userID int) ([]Conversation, error) {
	var conversations []Conversation
	err := r.db.Raw(`
		SELECT m.property_id, m.sender_id, m.receiver_id, m.message_text as last_message, m.sent_at as last_sent_at
		FROM messages m
		WHERE m.id IN (
			SELECT MAX(m2.id) FROM messages m2
			WHERE m2.sender_id = ? OR m2.receiver_id = ?
			GROUP BY LEAST(m2.sender_id, m2.receiver_id), m2.property_id
		)
		ORDER BY m.sent_at DESC
	`, userID, userID).Scan(&conversations).Error
	return conversations, err
}

func (r *messageRepository) FindHistory(propertyID, userID, otherUserID int) ([]models.Message, error) {
	var messages []models.Message
	err := r.db.
		Where("property_id = ?", propertyID).
		Where("(sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)",
			userID, otherUserID, otherUserID, userID).
		Order("sent_at ASC").
		Find(&messages).Error
	return messages, err
}